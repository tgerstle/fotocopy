import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import { generateGlobalPrompts } from "../../src/scaffolding/global_prompt_generator";

vi.mock("../../../../fotocopy.config", () => ({
  fotocopyConfig: {
    llm: {
      autoGenerateComponents: false,
    },
  },
}));

describe("Phase 5.1: Global Prompt Generator (Copilot Singleton Scaffolding)", () => {
  const testDir = path.join(__dirname, "temp-global");
  const originalManifestPath = path.join(testDir, "globals_manifest.json");
  const globalsMapPath = path.join(testDir, "llm_globals_map.json");
  const tokensPath = path.join(testDir, "tokens.json");
  const outputDir = path.join(testDir, "prompts", "globals");

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });

    // Original chunks
    await fs.writeFile(
      originalManifestPath,
      JSON.stringify({
        elementsToRemove: {
          hash123: ["<header></header>"],
        },
      }),
    );

    // Simulate LLM output map of globals (what `globals_classifier.ts` produces)
    await fs.writeFile(
      globalsMapPath,
      JSON.stringify({
        hash123: { inferredBlockType: "SiteHeader" },
        hash456: { inferredBlockType: "AppFooter" },
        hash789: { inferredBlockType: "Unknown" },
        hash111: { inferredBlockType: "SiteHeader" }, // tests deduplication
      }),
    );

    await fs.writeFile(
      tokensPath,
      JSON.stringify({
        color: { navBackground: { $value: "#000", $type: "color" } },
      }),
    );
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it("generates strict layout wrapper instructions mapped to variables", async () => {
    const files = await generateGlobalPrompts(
      originalManifestPath,
      globalsMapPath,
      tokensPath,
      outputDir,
    );
    expect(files).toHaveLength(2); // Should only create 2: SiteHeader, AppFooter due to Unknown/Deduplication filters

    const headerPromptPath = path.join(outputDir, "SiteHeader.prompt.md");
    expect(files).toContain(headerPromptPath);

    const headerContent = await fs.readFile(headerPromptPath, "utf-8");

    // It should declare singleton identity
    expect(headerContent).toContain("The target block is: `SiteHeader`");

    // It should enforce children wrappers
    expect(headerContent).toContain("MUST accept `children?: React.ReactNode`");

    // It should include the loaded design tokens
    expect(headerContent).toContain("navBackground");

    // It should include our newly patched rule stopping basic hex formatting
    expect(headerContent).toMatch(/DO NOT use arbitrary hex codes/);
  });
});
