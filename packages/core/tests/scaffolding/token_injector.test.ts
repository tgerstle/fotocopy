import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import { injectTokensToCSS } from "../../scripts/scaffolding/token_injector";

describe("Phase 1: Token Injection", () => {
  const tempDir = path.join(__dirname, "temp-injector");
  const tempCssPath = path.join(tempDir, "globals.css");

  beforeAll(async () => {
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(
      tempCssPath,
      `:root {\n  --background: oklch(1 0 0);\n}\n`
    );
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("injects semantic variables into the :root block of globals.css", async () => {
    const mockTokens = {
      cssVariables: {
        "--color-primary": "#ff0000",
        "--font-primary": "Inter",
      }
    };

    await injectTokensToCSS(tempCssPath, mockTokens);

    const resultingCss = await fs.readFile(tempCssPath, "utf-8");
    
    expect(resultingCss).toContain("--color-primary: #ff0000;");
    expect(resultingCss).toContain("--font-primary: Inter;");
    expect(resultingCss).toContain("/* --- FOTOCOPY DYNAMIC TOKENS --- */");
  });
});
