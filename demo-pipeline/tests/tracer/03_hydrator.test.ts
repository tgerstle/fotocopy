import { describe, it, expect, vi } from "vitest";
import { hydrate } from "../../scripts/hydrator";
import * as path from "path";

describe("Hydrator Engine (Phase 0, Step 3)", () => {
  const domPath = path.resolve(__dirname, "../../mock_capture/01_raw_dom.html");
  const llmPath = path.resolve(__dirname, "../../mock_llm/02_llm_output.json");
  const tokensPath = path.resolve(
    __dirname,
    "../../mock_capture/01_design_tokens.json",
  );

  it("should flawlessly extract matching HTML content into CMS Schema", async () => {
    const result = await hydrate(domPath, llmPath, tokensPath);

    // Assert Extracted Content
    expect(result.title).toBe("Home Page");
    expect(result.layout[0].blockType).toBe("Hero");

    const heroData = result.layout[0].data;
    expect(heroData.title).toBe("Welcome to Fotocopy"); // ID 102
    expect(heroData.subtitle).toBe("We migrate websites."); // ID 103
    expect(heroData.backgroundImage).toBe("/old-assets/hero.jpg"); // ID 104 image src extracted instead of text
  });

  it("should faithfully embed W3C Design Tokens", async () => {
    const result = await hydrate(domPath, llmPath, tokensPath);

    // Assert Token integration
    const primaryColor = result.layout[0].data.designTokens?.color?.primary;
    expect(primaryColor?.$value).toBe("#E24A4A");
    expect(primaryColor?.$type).toBe("color");
  });

  it("should gracefully handle hallucinations without crashing", async () => {
    // We mock a console.warn so our test output isn't noisy
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Create a temporary mock that contains a fake NodeId "999" (Hallucinated pointer)
    const fs = await import("fs/promises");
    const tempLlmPath = path.resolve(__dirname, "../../mock_llm/temp_llm.json");
    await fs.writeFile(
      tempLlmPath,
      JSON.stringify({
        page_id: "error_page",
        blocks: [
          {
            inferredBlockType: "Hero",
            confidence: 0.1,
            mappings: {
              titleNodeId: "999", // Does not exist
              subtitleNodeId: "103",
              backgroundImageNodeId: "104",
            },
          },
        ],
      }),
    );

    try {
      const result = await hydrate(domPath, tempLlmPath, tokensPath);

      // The schema for title is z.string() (required). Since the node is missing,
      // the hydrator creates data *without* a title property.
      // Zod should instantly catch and throw this data shape violation!
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error.name).toBe("ZodError");
      expect(warnSpy).toHaveBeenCalledWith(
        "Warning: Node ID 999 not found in DOM for property titleNodeId",
      );
    } finally {
      warnSpy.mockRestore();
      await fs.unlink(tempLlmPath);
    }
  });
});
