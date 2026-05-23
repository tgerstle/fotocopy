import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  extractTokens,
  snapToTailwindGrid,
} from "../../src/crawler/token_extractor";

describe("Stage 1: Token Extractor Validator", () => {
  it("loads mock computed styles", () => {
    const mockPath = path.resolve(__dirname, "mocks/mock_computed_styles.json");
    const mockData = JSON.parse(fs.readFileSync(mockPath, "utf-8"));
    expect(mockData.colors.primary).toBe("#ff0000");
  });

  it("snaps random pixel intervals to the nearest 4px Tailwind grid", () => {
    expect(snapToTailwindGrid("17px")).toBe("16px"); // nearest 4
    expect(snapToTailwindGrid("23px")).toBe("24px"); // nearest 4
    expect(snapToTailwindGrid("61px")).toBe("60px"); // nearest 4
    expect(snapToTailwindGrid("2px")).toBe("4px"); // rounded 0.5 becomes 1 * 4 = 4px
  });

  it("converts hex and rgb values to Tailwind HSL or raw RGB space correctly", () => {
    const mockPath = path.resolve(__dirname, "mocks/mock_computed_styles.json");
    const rawTokens = JSON.parse(fs.readFileSync(mockPath, "utf-8"));

    const semanticTokens = extractTokens(rawTokens);

    // Validate Colors (shadcn utilizes HSL, but spec says "Hex codes are parsed into raw rgb spacing natively for Tailwind")
    // Let's assert it transforms `#ff0000` to `255 0 0`
    expect(semanticTokens.cssVariables["--primary"]).toBe("255 0 0");
    // `rgb(20, 20, 20)`
    expect(semanticTokens.cssVariables["--background"]).toBe("20 20 20");
  });

  it("maps correct variable names according to Shadcn ontology", () => {
    const mockPath = path.resolve(__dirname, "mocks/mock_computed_styles.json");
    const rawTokens = JSON.parse(fs.readFileSync(mockPath, "utf-8"));

    const semanticTokens = extractTokens(rawTokens);

    expect(semanticTokens.cssVariables).toHaveProperty("--background");
    expect(semanticTokens.cssVariables).toHaveProperty("--primary");
    expect(semanticTokens.cssVariables).toHaveProperty("--muted");
    expect(semanticTokens.cssVariables).toHaveProperty("--card");
    expect(semanticTokens.cssVariables).toHaveProperty("--radius");
    expect(semanticTokens.cssVariables["--radius"]).toBe("0.5rem"); // '5px' is approximately 0.3rem or nearest step. Let's just say it gets processed to rems.
  });
});
