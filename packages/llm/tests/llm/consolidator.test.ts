import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import { consolidateComponents } from "../../src/llm/consolidator";

describe("Phase 3: Component Consolidation", () => {
  const testOutputDir = path.join(__dirname, "temp-output");
  const manifestPath = path.join(__dirname, "temp-components.json");

  beforeAll(async () => {
    await fs.mkdir(testOutputDir, { recursive: true });

    // Create some fake hydrated JSON outputs with overlapping shapes
    await fs.writeFile(
      path.join(testOutputDir, "page1.json"),
      JSON.stringify({
        title: "Page 1",
        layout: [
          {
            inferredBlockType: "HeroBanner",
            mappings: { title: "Hello", subtitle: "World" },
          },
          {
            inferredBlockType: "StaffGrid",
            mappings: { teamMembers: "array" },
          },
        ],
      }),
    );

    await fs.writeFile(
      path.join(testOutputDir, "page2.json"),
      JSON.stringify({
        title: "Page 2",
        layout: [
          {
            inferredBlockType: "HeroBanner",
            mappings: { title: "Hi", image: "img.jpg", designTokens: {} },
          },
          { inferredBlockType: "FAQ", mappings: { questions: "q" } },
        ],
      }),
    );
  });

  afterAll(async () => {
    await fs.rm(testOutputDir, { recursive: true, force: true });
    await fs.rm(manifestPath, { force: true });
  });

  it("aggregates unique components and keys across output files", async () => {
    const manifest = await consolidateComponents(testOutputDir, manifestPath);

    expect(manifest).toHaveProperty("HeroBanner");
    expect(manifest.HeroBanner.matches).toContain("HeroBanner");

    // It should merge keys from page1 and page2 for HeroBanner
    expect(manifest.HeroBanner.schema).toHaveProperty("title");
    expect(manifest.HeroBanner.schema).toHaveProperty("subtitle");
    expect(manifest.HeroBanner.schema).toHaveProperty("image");

    // It should exclude designTokens
    expect(manifest.HeroBanner.schema).not.toHaveProperty("designTokens");

    expect(manifest).toHaveProperty("StaffGrid");
    expect(manifest.StaffGrid.schema).toHaveProperty("teamMembers");

    expect(manifest).toHaveProperty("FAQ");
  });
});
