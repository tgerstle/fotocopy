import { describe, it, expect } from "vitest";
import {
  inferTemplates,
  PageTopology,
} from "../../src/intersection/template_inference";
import crypto from "crypto";

describe("Phase 2: Step 3 - Template Inference", () => {
  it("clusters URLs into a CMS Collection based on shared inner structural topology", () => {
    // We mock 5 pages.
    // Pages 1-3 are /news/ articles. They share the same structural skeleton inside the <main>.
    // Page 4 is a /news/ article but entirely different structure (e.g. ad-hoc landing page).
    // Page 5 is an ad-hoc root page.

    const newsStructureA = `
      <html>
        <body>
          <nav>Global Header</nav>
          <main>
            <h1>Title</h1>
            <p class="author">Author</p>
            <div class="content"><p>Some varying text</p></div>
          </main>
          <footer>Global Footer</footer>
        </body>
      </html>
    `;

    const newsStructureB = `
      <html>
        <body>
          <nav>Global Header</nav>
          <main>
            <h1>Different Title</h1>
            <p class="author">Different Author</p>
            <div class="content"><p>Totally different text payload!</p></div>
          </main>
          <footer>Global Footer</footer>
        </body>
      </html>
    `;

    // Same topology as A and B! (H1 -> P.author -> DIV.content)
    const newsStructureC = `
      <html>
        <body>
          <nav>Global Header</nav>
          <main>
            <h1>Test Title</h1>
            <p class="author">Test Author</p>
            <div class="content"><p>Hello world</p></div>
          </main>
          <footer>Global Footer</footer>
        </body>
      </html>
    `;

    // DIFFERENT structure! Missing the author, adds an image gallery.
    const newsStructureAdHoc = `
      <html>
        <body>
          <nav>Global Header</nav>
          <main>
            <h1>Special Event!</h1>
            <div class="gallery"><img src="1.jpg"/><img src="2.jpg"/></div>
          </main>
          <footer>Global Footer</footer>
        </body>
      </html>
    `;

    const pages: PageTopology[] = [
      { url: "/news/2026/hello-world", html: newsStructureA },
      { url: "/news/2026/another-post", html: newsStructureB },
      { url: "/news/2026/third-post", html: newsStructureC },
      { url: "/news/special-event", html: newsStructureAdHoc }, // Same prefix, different structure
      { url: "/about-us", html: newsStructureA }, // Same structure, different prefix
    ];

    // Mocking the hashing engine output for `<nav>` and `<footer>` signatures
    const navHash = crypto
      .createHash("sha256")
      .update("<NAV></NAV>")
      .digest("hex");
    const footerHash = crypto
      .createHash("sha256")
      .update("<FOOTER></FOOTER>")
      .digest("hex");

    // Call inference with the mocked global hashes
    const clusters = inferTemplates(pages, [navHash, footerHash], 2);

    // It should have identified exactly 1 Template Collection: NEWS_COLLECTION
    // It should contain 3 URLs (hello-world, another-post, third-post).
    // It MUST ignore the special-event because its box-model doesn't match!
    // It MUST ignore the /about-us page because its URL prefix doesn't match!

    expect(clusters.length).toBe(1);
    expect(clusters[0].templateName).toBe("NEWS_COLLECTION");
    expect(clusters[0].urlPattern).toBe("/news/*");
    expect(clusters[0].matchingUrls.length).toBe(3);
    expect(clusters[0].matchingUrls).toContain("/news/2026/hello-world");
    expect(clusters[0].matchingUrls).toContain("/news/2026/another-post");
    expect(clusters[0].matchingUrls).toContain("/news/2026/third-post");
    expect(clusters[0].matchingUrls).not.toContain("/news/special-event");
  });
});
