import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generatePrompts } from "../../src/scaffolding/prompt_generator";
import { generateGlobalPrompts } from "../../src/scaffolding/global_prompt_generator";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

describe("Phase 6.3: Dumb Components for Stateful Global Data", () => {
  let tempDir: string;
  let manifestPath: string;
  let globalManifestPath: string;
  let originalGlobalManifestPath: string;
  let tokensPath: string;
  let outputDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "fotocopy-dumb-test-"));
    outputDir = path.join(tempDir, "prompts");
    manifestPath = path.join(tempDir, "components.json");
    globalManifestPath = path.join(tempDir, "globals.json");
    originalGlobalManifestPath = path.join(tempDir, "original_globals.json");
    tokensPath = path.join(tempDir, "tokens.json");

    fs.mkdirSync(outputDir, { recursive: true });

    // Mock Tokens
    fs.writeFileSync(
      tokensPath,
      JSON.stringify({ cssVariables: { "--color-brand": "#fff" } }),
    );

    // Mock App Component
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({
        SearchGridBlock: {
          schema: {
            queryTerm: "string",
            results: "Array<{id: string; title: string;}>",
          },
        },
      }),
    );

    // Mock Global Component
    fs.writeFileSync(
      globalManifestPath,
      JSON.stringify({
        "hash-123": { inferredBlockType: "GlobalSearchContainer" },
      }),
    );
    fs.writeFileSync(
      originalGlobalManifestPath,
      JSON.stringify({ elementsToRemove: {} }),
    );
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("injects state decoupling constraints into standard component prompts", async () => {
    await generatePrompts(manifestPath, tokensPath, outputDir);
    const prompt = fs.readFileSync(
      path.join(outputDir, "SearchGridBlock.prompt.md"),
      "utf-8",
    );

    expect(prompt).toContain("# State & Data Coupling (CRITICAL)");
    expect(prompt).toContain("DO NOT inject complex application state hooks");
    expect(prompt).toContain('treat the block as a "Dumb Component"');
  });

  it("injects state decoupling constraints into global component prompts", async () => {
    await generateGlobalPrompts(
      originalGlobalManifestPath,
      globalManifestPath,
      tokensPath,
      outputDir,
    );
    const prompt = fs.readFileSync(
      path.join(outputDir, "GlobalSearchContainer.prompt.md"),
      "utf-8",
    );

    expect(prompt).toContain("# State & Data Coupling (CRITICAL)");
    expect(prompt).toContain("DO NOT inject complex application state hooks");
    expect(prompt).toContain('treat the block as a "Dumb Component"');
  });
});
