import { describe, it, expect } from "vitest";
import { chromium, Page } from "playwright";
import * as path from "path";
import * as fs from "fs/promises";
// Mock out the fs writefile calls so this test doesnt dump files into our output directory
import { crawlAndCapture } from "../../src/crawler/capture";

describe("Phase 1: Synthetic DOM Tests (Geometry & Exclusion Rules)", () => {
  it("mathematically computes geometry, removes hidden items, and extracts SEO", async () => {
    // We create a completely controlled DOM environment locally to test the math without network variables
    const syntheticHtml = `
      <html>
        <head>
          <title>Synthetic Test Page</title>
          <meta name="description" content="This is an SEO description test.">
        </head>
        <body style="margin: 0; padding: 0;">
          <div id="box-1" style="width: 100px; height: 100px; position: absolute; top: 50px; left: 20px;">Visible Box</div>
          <div id="hidden-box" style="display: none;">Invisible Box</div>
          <script>console.log("Ignore me")</script>
        </body>
      </html>
    `;

    // To mock crawlAndCapture locally, we write syntheticHtml to disk, serve it via file://
    const tempFilePath = path.resolve(__dirname, "temp-synthetic.html");
    await fs.writeFile(tempFilePath, syntheticHtml, "utf-8");

    try {
      const result = await crawlAndCapture({
        url: `file://${tempFilePath}`,
        outputDir: path.resolve(__dirname, "../../output/test_temp"),
      });

      // 1. Assert SEO Metadata extracted properly
      expect(result.seo.title).toBe("Synthetic Test Page");
      expect(result.seo.description).toBe("This is an SEO description test.");

      // 2. Assert Hidden boxes & scripts were excluded entirely
      // The only node that should have been captured is the BODY and the #box-1
      expect(result.nodeMap.length).toBe(1);

      // 3. Assert Geometry correctness mathematically
      const boxNode = result.nodeMap[0];
      expect(boxNode.tag).toBe("DIV");
      expect(boxNode.geometry.width).toBe(100);
      expect(boxNode.geometry.height).toBe(100);
      expect(boxNode.geometry.x).toBe(20);
      expect(boxNode.geometry.y).toBe(50);
    } finally {
      // Clean up files
      await fs.unlink(tempFilePath);
      await fs.rm(path.resolve(__dirname, "../../output/test_temp"), {
        recursive: true,
        force: true,
      });
    }
  });
});
