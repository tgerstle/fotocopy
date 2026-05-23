import { describe, test, expect } from "vitest";
import { z } from "zod";
import { ConfigSchema } from "../../engine/src/config";

describe("Config Validation", () => {
  test("throws standard Zod error on invalid temperature", () => {
    const invalidConfig = {
      outputDir: "./out",
      llm: {
        model: "llama2",
        endpoint: "http://localhost:11434/api/generate",
        temperature: "high", // Invalid type
      },
    };

    expect(() => ConfigSchema.parse(invalidConfig)).toThrowError(z.ZodError);

    try {
      ConfigSchema.parse(invalidConfig);
    } catch (e: any) {
      expect(e.issues[0].message).toContain("Expected number, received string");
    }
  });

  test("throws error if llm endpoint is not a valid URL", () => {
    const invalidConfig = {
      outputDir: "./out",
      llm: {
        model: "llama2",
        endpoint: "invalid-url",
        temperature: 0.5,
      },
    };

    expect(() => ConfigSchema.parse(invalidConfig)).toThrowError(z.ZodError);
  });
});
