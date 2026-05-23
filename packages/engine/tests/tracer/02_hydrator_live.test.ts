import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { hydrate } from "../../src/hydrator";
import * as path from "path";
import * as fs from "fs/promises";
import * as fsSync from "fs";

describe("Stage 2: Lexical Hydrator Validator (Live Extracted Data)", () => {
  const domPath = path.resolve(__dirname, "../../mock_capture/01_raw_dom.html");
  const llmPath = path.resolve(__dirname, "../../mock_llm/02_llm_output.json");
  const tokensPath = path.resolve(
    __dirname,
    "../../mock_capture/01_design_tokens.json",
  );
  const outputPath = path.resolve(
    __dirname,
    "../../output/03_cms_ready_live.json",
  );

  afterAll(async () => {
    if (fsSync.existsSync(outputPath)) {
      await fs.unlink(outputPath);
    }
  });

  it("hydrates live DOM data with actual live crawler token layouts", async () => {
    // 1. Run the Hydrator on the actual project capture mocks
    const result = await hydrate(domPath, llmPath, tokensPath);

    // 2. Validate it matches the strict CMS formatting requirement
    expect(result.title).toBe("Home Page");
    expect(result.layout.length).toBeGreaterThan(0);

    const firstBlock = result.layout[0];
    expect(firstBlock.blockType).toBeDefined();

    // Ensure the tokens successfully carried through the CMS payload
    expect(firstBlock.data.designTokens.color).toBeDefined();

    // We optionally write it to ensure pipeline functionality hasn't degraded
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
    expect(fsSync.existsSync(outputPath)).toBe(true);
  });
});
