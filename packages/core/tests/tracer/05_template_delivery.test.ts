import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";
import { extractSandboxTemplate } from "../../scripts/scaffolding/sandbox_extractor";

describe("Stage 5: Template Sandbox Copy Validator", () => {
  const dummySrc = path.resolve(__dirname, "./mocks/dummy_sandbox");
  const dummyTarget = path.resolve(__dirname, "./mocks/output_dir");

  beforeAll(async () => {
    // 1. Mock Input (Fake Sandbox environment with some fake node_modules)
    await fs.mkdir(path.join(dummySrc, "node_modules"), { recursive: true });
    await fs.mkdir(path.join(dummySrc, ".next"), { recursive: true });
    await fs.mkdir(path.join(dummySrc, "src"), { recursive: true });

    await fs.writeFile(
      path.join(dummySrc, "node_modules", "ignore.js"),
      "console.log('Ignore me')",
    );
    await fs.writeFile(path.join(dummySrc, ".next", "cache.json"), "{}");
    await fs.writeFile(
      path.join(dummySrc, "src", "globals.css"),
      "body { color: black; }",
    );
  });

  afterAll(async () => {
    // Cleanup generated mock artifacts
    await fs.rm(dummySrc, { recursive: true, force: true });
    await fs.rm(dummyTarget, { recursive: true, force: true });
  });

  it("extracts the sandbox cleanly into the target while stripping Node overhead", () => {
    // 2. Action
    const success = extractSandboxTemplate(dummySrc, dummyTarget);
    expect(success).toBe(true);

    // 3. Mock Output Assertions
    // Target created
    expect(fsSync.existsSync(dummyTarget)).toBe(true);

    // Crucial src files carried over
    expect(
      fsSync.existsSync(path.join(dummyTarget, "src", "globals.css")),
    ).toBe(true);

    // Node_modules and .next stripped
    expect(fsSync.existsSync(path.join(dummyTarget, "node_modules"))).toBe(
      false,
    );
    expect(fsSync.existsSync(path.join(dummyTarget, ".next"))).toBe(false);
  });
});
