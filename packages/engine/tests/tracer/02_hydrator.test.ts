import { describe, it, expect, vi } from "vitest";
import { hydrate } from "../../src/hydrator";
import * as path from "path";
import * as fs from "fs/promises";

describe("Stage 2: Lexical Hydrator Validator", () => {
  const mockDomPath = path.resolve(__dirname, "./mocks/mock_raw_dom.html");
  const mockLlmPath = path.resolve(__dirname, "./mocks/mock_llm_output.json");
  const mockTokensPath = path.resolve(
    __dirname,
    "./mocks/mock_computed_styles.json",
  );

  it("extracts exact strings matching pointer IDs (Zero-Hallucination)", async () => {
    // Generate a temporary standard DesignTokens format in order for Schema to not throw.
    // The previous token test (Stage 1) handled converting this, but Hydrator expects `designTokens`
    // to pass Zod schema in `schemas/tokens`. We can bypass full tokens for this specific lexical test
    // or just mock a valid token file. Let's create a minimal valid tokens payload.
    const minimalTokensPath = path.resolve(
      __dirname,
      "./mocks/minimal_tokens.json",
    );
    await fs.writeFile(
      minimalTokensPath,
      JSON.stringify({
        color: { primary: { $value: "#E24A4A", $type: "color" } },
      }),
    );

    const result = await hydrate(mockDomPath, mockLlmPath, minimalTokensPath);

    // Expecting 101 -> Main Header, 102 -> Target Subtitle
    expect(result.layout[0].blockType).toBe("Hero");
    const heroData = result.layout[0].data;

    expect(heroData.title).toBe("Main Header"); // mapped to 101
    expect(heroData.subtitle).toBe("Target Subtitle"); // mapped to 102

    await fs.unlink(minimalTokensPath);
  });

  it("gracefully handles hallucinated IDs without crashing", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const minimalTokensPath = path.resolve(
      __dirname,
      "./mocks/minimal_tokens.json",
    );
    await fs.writeFile(
      minimalTokensPath,
      JSON.stringify({
        color: { primary: { $value: "#E24A4A", $type: "color" } },
      }),
    );

    const hallucinatedPath = path.resolve(
      __dirname,
      "./mocks/hallucinated_llm.json",
    );
    await fs.writeFile(
      hallucinatedPath,
      JSON.stringify({
        page_id: "home",
        blocks: [
          {
            inferredBlockType: "Hero",
            confidence: 0.9,
            mappings: {
              titleNodeId: "101",
              hallucinatedNodeId: "999", // Does not exist
            },
          },
        ],
      }),
    );

    try {
      const result = await hydrate(
        mockDomPath,
        hallucinatedPath,
        minimalTokensPath,
      );

      // It should successfully run and warn us
      expect(warnSpy).toHaveBeenCalledWith(
        "Warning: Node ID 999 not found in DOM for property hallucinatedNodeId",
      );

      // The hallucinated field should be seamlessly omitted / ignored
      expect(result.layout[0].data.hallucinated).toBeUndefined();
    } finally {
      warnSpy.mockRestore();
      await fs.unlink(hallucinatedPath);
      await fs.unlink(minimalTokensPath);
    }
  });
});
