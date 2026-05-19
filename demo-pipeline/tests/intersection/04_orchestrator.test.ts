import { describe, it, expect } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import { executePurgeAndSlice } from "../../scripts/intersection/orchestrator";

describe("Phase 2: Step 4 - Orchestrator Integration", () => {
  const tempHtmlDir = path.resolve(__dirname, "../../output/test_orch_html");
  const tempGeomDir = path.resolve(__dirname, "../../output/test_orch_geom");
  const tempOutDir = path.resolve(__dirname, "../../output/test_orch_out");

  it("identifies global headers, maps data-awa-id, and safely purges them from the chunk slicer array", async () => {
    await fs.mkdir(tempHtmlDir, { recursive: true });
    await fs.mkdir(tempGeomDir, { recursive: true });

    // Simulate 3 HTML pages where `<nav>` is identical (global)
    // The `<main>` section differs completely.
    const pages = [
      `<html><body>
        <nav class="header active" data-awa-id="1"><ul><li data-awa-id="2">Home</li></ul></nav>
        <main data-awa-id="3"><h1 data-awa-id="4">Page 1</h1></main>
       </body></html>`,
      `<html><body>
        <nav class="header focus" data-awa-id="1"><ul><li data-awa-id="2">About</li></ul></nav>
        <main data-awa-id="3"><div data-awa-id="4">Page 2</div></main>
       </body></html>`,
      `<html><body>
        <nav class="header" data-awa-id="1"><ul><li data-awa-id="2">Contact</li></ul></nav>
        <main data-awa-id="3"><section data-awa-id="4">Page 3</section></main>
       </body></html>`,
    ];

    // Mock Geometry JSON for Page 1
    // The chunk_slicer needs widths/heights to correctly fire boundaries.
    const mockGeomPage1 = [
      { id: 1, tag: "NAV", geometry: { y: 0, height: 100 } }, // Header!
      { id: 2, tag: "LI", geometry: { y: 10, height: 20 } },
      {
        id: 3,
        tag: "MAIN",
        geometry: { y: 100, height: 500, width: 1000, parentWidth: 1000 },
      }, // Boundary trigger (DIV > 95% or block)
      { id: 4, tag: "H1", geometry: { y: 110, height: 50 } }, // Content
    ];

    // Write Files
    for (let i = 0; i < pages.length; i++) {
      await fs.writeFile(path.join(tempHtmlDir, `page${i}_dom.html`), pages[i]);
      await fs.writeFile(
        path.join(tempGeomDir, `page${i}_geometry.json`),
        JSON.stringify(mockGeomPage1),
      ); // Same geometry mock for all
    }

    try {
      const manifest = await executePurgeAndSlice(
        tempHtmlDir,
        tempGeomDir,
        tempOutDir,
      );

      // The orchestrator should have found exactly 1 global footprint (the <nav>)
      expect(manifest.globalHashes.length).toBe(1);

      // Inspect output chunks specifically for page0
      const page0ChunksDir = path.join(tempOutDir, "page0");
      const files = await fs.readdir(page0ChunksDir);

      // Should have chunk_01.json
      expect(files).toContain("chunk_01.json");

      const chunkData = await fs.readFile(
        path.join(page0ChunksDir, "chunk_01.json"),
        "utf8",
      );
      const chunkArr = JSON.parse(chunkData);

      // Assert that ID 1 and ID 2 (The Nav and its Li) were physically purged!
      // Consequently, Chunk 1 should only contain ID 3 (MAIN) and ID 4 (H1)
      const idsInsideChunk = chunkArr.nodes.map((n: any) => n.id);

      expect(idsInsideChunk).toContain(3);
      expect(idsInsideChunk).toContain(4);
      expect(idsInsideChunk).not.toContain(1);
      expect(idsInsideChunk).not.toContain(2);
    } finally {
      // Clean up test directories
      await fs.rm(tempHtmlDir, { recursive: true, force: true });
      await fs.rm(tempGeomDir, { recursive: true, force: true });
      await fs.rm(tempOutDir, { recursive: true, force: true });
    }
  });
});
