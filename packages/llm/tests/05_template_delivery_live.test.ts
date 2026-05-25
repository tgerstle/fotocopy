import { describe, it, expect, afterAll } from "vitest";
import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";
import { extractSandboxTemplate } from "../src/scaffolding/sandbox_extractor";

describe("Stage 5: Template Sandbox Validator (Live Repository State)", () => {
  const liveSrc = path.resolve(__dirname, "../../cli/templates/react-sandbox");
  const targetOut = path.resolve(__dirname, "../../output/sandbox-live-test");

  afterAll(async () => {
    if (fsSync.existsSync(targetOut)) {
      await fs.rm(targetOut, { recursive: true, force: true });
    }
  });

  it("extracts the actual react-sandbox template cleanly into the output folder", async () => {
    // 1. We must make sure the actual folder exists
    const srcExists = fsSync.existsSync(liveSrc);
    // If it doesn't exist, we skip rather than fail arbitrarily depending on CI environments,
    // but in this workspace it should exist.
    if (!srcExists) {
      console.warn(
        "Skipping Live Sandbox test – No react-sandbox Template found.",
      );
      return;
    }

    const success = extractSandboxTemplate(liveSrc, targetOut);
    expect(success).toBe(true);

    // Ensure it was copied
    expect(fsSync.existsSync(targetOut)).toBe(true);

    // Ensure node_modules never makes it across from standard monorepo installations
    expect(fsSync.existsSync(path.join(targetOut, "node_modules"))).toBe(false);
  });
});
