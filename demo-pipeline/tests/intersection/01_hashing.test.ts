import { describe, it, expect } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import { computeGlobalIntersections } from "../../scripts/intersection/hash_engine";

describe("Phase 2: Global Intersection Math", () => {
  const tempDir = path.resolve(__dirname, "../../output/test_intersection");

  it("mathematically detects identical headers and footers across multiple pages", async () => {
    await fs.mkdir(tempDir, { recursive: true });

    // We build 3 synthetic pages.
    // The <nav> and <footer> are EXACTLY identical structurally.
    // The <main> content is completely different.
    const pages = [
      `<html><body>
        <nav class="header active"><ul><li>Home</li></ul></nav>
        <main><h1>Page 1</h1><p>Unique content A</p></main>
        <footer class="site-footer"><div>Copyright 2026</div></footer>
       </body></html>`,
      `<html><body>
        <nav class="header focus"><ul><li>About</li></ul></nav>
        <main><div><h2>Page 2</h2><img src="b.jpg"></div></main>
        <footer class="site-footer"><div>Copyright 2026</div></footer>
       </body></html>`,
      `<html><body>
        <nav class="header"><ul><li>Contact</li></ul></nav>
        <main><section>Some deeply nested unique stuff C</section></main>
        <footer class="site-footer"><div>Copyright 2026</div></footer>
       </body></html>`,
    ];

    // Write temp mocks
    for (let i = 0; i < pages.length; i++) {
      await fs.writeFile(path.join(tempDir, `page${i}_dom.html`), pages[i]);
    }

    try {
      const manifest = await computeGlobalIntersections(tempDir, 0.9);

      // It should have mathematically identified exactly 2 components: The Nav and the Footer.
      // E.g., it ignores the <main> block because its structural hash differs on every page.
      expect(manifest.globalHashes.length).toBe(2);

      // Check values map correctly by inspecting the debug arrays
      const previews = Object.values(manifest.elementsToRemove).map(
        (arr) => arr[1],
      );

      const containsNav = previews.some((p) =>
        p.includes('<NAV class="header">'),
      );
      const containsFooter = previews.some((p) =>
        p.includes('<FOOTER class="site-foo'),
      );

      expect(containsNav).toBe(true);
      expect(containsFooter).toBe(true);
    } finally {
      // Clean up test suite files
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});
