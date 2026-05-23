import { describe, it, expect, vi } from "vitest";
import { parseAndHeal } from "../src/scaffolding/ast_guard";

describe("Stage 4: AST Self-Healing Guard Validator", () => {
  it("detects syntax errors in generated component code and invokes reflection loop", async () => {
    // 1. Mock Input (Broken React code)
    const brokenCode = `export const Footer = () => <div>Hello</rabutton>`;
    const fixedCode = `export const Footer = () => <div>Hello</div>`;

    // 2. Mock LLM Reflection Caller
    const mockLlmHealer = vi
      .fn()
      .mockResolvedValueOnce(brokenCode) // 1st retry: LLM fails again
      .mockResolvedValueOnce(fixedCode); // 2nd retry: LLM fixes it

    // 3. Action
    const result = await parseAndHeal(brokenCode, mockLlmHealer, 2);

    // 4. Assertions
    expect(mockLlmHealer).toHaveBeenCalledTimes(2); // Retried twice
    expect(result.success).toBe(true);
    expect(result.code).toBe(fixedCode);
  });

  it("aborts after max_retries limit is hit", async () => {
    const universallyBrokenCode = `export const Broken = () => <div>Uh oh</div></div>`;

    // LLM just keeps failing
    const mockLlmHealer = vi.fn().mockResolvedValue(universallyBrokenCode);

    const result = await parseAndHeal(universallyBrokenCode, mockLlmHealer, 2);

    expect(mockLlmHealer).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Syntax error/i);
  });

  it("passes immediately if code is perfectly valid", async () => {
    const validCode = `export const Great = () => <div>Hello</div>;`;
    const mockLlmHealer = vi.fn();

    const result = await parseAndHeal(validCode, mockLlmHealer, 2);

    expect(mockLlmHealer).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.code).toBe(validCode);
  });
});
