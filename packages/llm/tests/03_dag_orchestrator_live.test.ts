import { describe, it, expect, vi } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import { generateMapReduceStrategy } from "../src/scaffolding/prompt_generator";
import { extractTokens } from "@fotocopy/engine/src/crawler/token_extractor";

describe("Stage 3: DAG Orchestrator Validator (Live Blueprint)", () => {
  const liveTokensPath = path.resolve(
    __dirname,
    "../../../mock_capture/01_design_tokens.json",
  );
  const liveComponentDbPath = path.resolve(
    __dirname,
    "../../../output/mock_fotocopy.components.json",
  );

  it("orchestrates a real blueprint chunk from the DB", async () => {
    // 1. Load actual files
    const captureData = JSON.parse(await fs.readFile(liveTokensPath, "utf-8"));
    const semanticTokens = extractTokens(captureData);

    const componentDb = JSON.parse(
      await fs.readFile(liveComponentDbPath, "utf-8"),
    );

    // Pick first component from DB safely
    const firstKey = Object.keys(componentDb)[0];
    const blueprint = { name: firstKey, schema: componentDb[firstKey].schema };

    // 2. Mock LLM Analyzer mapped onto the real DB inputs
    const mockLlmAnalyzer = vi.fn().mockResolvedValue({
      primitives: ["Button", "Icon"],
      orchestrator: firstKey,
    });

    // 3. Action
    const result = await generateMapReduceStrategy(
      blueprint,
      semanticTokens,
      mockLlmAnalyzer,
    );

    // 4. Validate
    expect(mockLlmAnalyzer).toHaveBeenCalledWith(blueprint);
    expect(result.systemPrompt).toContain("--primary: 226 74 74;"); // From the live 01_design_tokens.json
    expect(result.tasks.length).toBe(3);
  });
});
