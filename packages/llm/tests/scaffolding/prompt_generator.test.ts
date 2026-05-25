import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import { generatePrompts } from "../../src/scaffolding/prompt_generator";

vi.mock("@fotocopy/engine", () => ({
  getConfig: () => ({ llm: { autoGenerateComponents: false } }),
}));

describe("Phase 4: Prompt Generator (Copilot Scaffolding)", () => {
  const testDir = path.join(__dirname, "temp-scaffolding");
  const manifestPath = path.join(testDir, "fotocopy.components.json");
  const tokensPath = path.join(testDir, "tokens.json");
  const outputDir = path.join(testDir, "prompts");

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });

    await fs.writeFile(
      manifestPath,
      JSON.stringify({
        Hero: {
          matches: ["Hero"],
          schema: { title: "string", subtitle: "string" },
        },
        FAQ: { matches: ["FAQ"], schema: { questions: "array" } },
      }),
    );

    await fs.writeFile(
      tokensPath,
      JSON.stringify({
        color: { primary: { $value: "#E24A4A", $type: "color" } },
      }),
    );
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it("generates markdown prompts correctly infused with shape and tokens", async () => {
    const files = await generatePrompts(manifestPath, tokensPath, outputDir);
    expect(files).toHaveLength(2);

    const heroPromptPath = path.join(outputDir, "Hero.prompt.md");
    const faqPromptPath = path.join(outputDir, "FAQ.prompt.md");

    const heroContent = await fs.readFile(heroPromptPath, "utf-8");
    expect(heroContent).toContain("The target block is: `Hero`");
    expect(heroContent).toContain("title");
    expect(heroContent).toContain("subtitle");
    expect(heroContent).toContain("text-primary"); // mapped token check

    const faqContent = await fs.readFile(faqPromptPath, "utf-8");
    expect(faqContent).toContain("The target block is: `FAQ`");
    expect(faqContent).toContain("questions");
  });
});
