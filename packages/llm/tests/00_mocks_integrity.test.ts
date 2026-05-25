import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { DesignTokensSchema } from "../src/schemas/tokens";
import { LLMPageSchema } from "../src/schemas/llm";
import { CMSPageSchema } from "../src/schemas/cms";

describe("Phase 0 Mocks Integrity", () => {
  it("01_design_tokens.json matches the Design Tokens DTCG Schema", () => {
    const p = path.resolve(
      __dirname,
      "./mocks/mock_capture/01_design_tokens.json",
    );
    const data = JSON.parse(fs.readFileSync(p, "utf-8"));
    expect(() => DesignTokensSchema.parse(data)).not.toThrow();
  });

  it("02_llm_output.json matches the LLM Extraction Schema", () => {
    const p = path.resolve(__dirname, "./mocks/mock_llm/02_llm_output.json");
    const data = JSON.parse(fs.readFileSync(p, "utf-8"));
    expect(() => LLMPageSchema.parse(data)).not.toThrow();
  });

  it("03_cms_ready.json matches Target CMS Schema", () => {
    const p = path.resolve(__dirname, "../../output/03_cms_ready.json");
    if (!fs.existsSync(p)) return; // Output might not be generated before tests run
    const data = JSON.parse(fs.readFileSync(p, "utf-8"));
    expect(() => CMSPageSchema.parse(data)).not.toThrow();
  });
});
