import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fetchSitemapUrls } from "../../src/crawler/sitemap";

describe("Sitemap XML Parser", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("gracefully falls back on malformed or non-XML pages", async () => {
    global.fetch = vi.fn().mockImplementation(async () => ({
      text: async () => "<not-a-sitemap></not-a-sitemap>",
    }));

    const result = await fetchSitemapUrls("http://mock.com/sitemap.xml");
    expect(result).toEqual([]);
  });

  it("parses standard urlset correctly", async () => {
    global.fetch = vi.fn().mockImplementation(async () => ({
      text: async () => `
        <?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
           <url><loc>http://mock.com/1</loc></url>
           <url><loc>http://mock.com/2</loc></url>
        </urlset>
      `,
    }));

    const result = await fetchSitemapUrls("http://mock.com/sitemap.xml");
    expect(result).toEqual(["http://mock.com/1", "http://mock.com/2"]);
  });

  it("parses sitemapindex correctly by recursively fetching nested sitemaps", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url === "http://mock.com/index.xml") {
        return {
          text: async () => `
            <?xml version="1.0" encoding="UTF-8"?>
            <sitemapindex>
               <sitemap><loc>http://mock.com/sitemap1.xml</loc></sitemap>
               <sitemap><loc>http://mock.com/sitemap2.xml</loc></sitemap>
            </sitemapindex>
          `,
        };
      }
      if (url === "http://mock.com/sitemap1.xml") {
        return {
          text: async () =>
            `<urlset><url><loc>http://mock.com/a</loc></url></urlset>`,
        };
      }
      if (url === "http://mock.com/sitemap2.xml") {
        return {
          text: async () =>
            `<urlset><url><loc>http://mock.com/b</loc></url></urlset>`,
        };
      }
      return { text: async () => "" };
    });

    const result = await fetchSitemapUrls("http://mock.com/index.xml");
    expect(result).toEqual(["http://mock.com/a", "http://mock.com/b"]);
  });

  it("handles fetch failures gracefully", async () => {
    global.fetch = vi.fn().mockImplementation(async () => {
      throw new Error("HTTP 404");
    });

    await expect(fetchSitemapUrls("http://mock.com/404.xml")).rejects.toThrow(
      "HTTP 404",
    );
  });
});
