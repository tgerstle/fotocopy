import { describe, it, expect, beforeEach, afterAll, vi, Mock } from "vitest";
import { runDiscovery } from "./spider";
import { db, initializeDatabase } from "../state_db";
import * as fs from "fs";
import * as path from "path";

// Mock Config to prevent reading actual files during tests
vi.mock("../../../../fotocopy.config", () => ({
  fotocopyConfig: {
    staticUrlList: ["https://www.css-snacks.com/static-1"],
    sitemapUrl: "https://www.css-snacks.com/sitemap.xml",
    intakeCsvPath: "/fake/path/legacy-urls.csv",
  },
}));

// Mock FS
vi.mock("fs", async () => {
  const actualFs = (await vi.importActual("fs")) as any;
  return {
    ...actualFs,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  };
});

describe("Phase 5.2: Dry-Run Spidering", () => {
  beforeEach(() => {
    // Reset DB
    initializeDatabase(
      path.resolve(__dirname, "../../../../output/test_output"),
    );
    db.exec(`DROP TABLE IF EXISTS url_queue;`);
    initializeDatabase(
      path.resolve(__dirname, "../../../../output/test_output"),
    );
    vi.restoreAllMocks();

    // Reset Global fetch mock
    global.fetch = vi.fn() as Mock;
  });

  afterAll(() => {
    if (db) db.exec(`DROP TABLE IF EXISTS url_queue;`);
  });

  it("aggregates static URLs, CSVs, and Sitemaps avoiding duplicates", async () => {
    const fakeConfig = {
      staticUrlList: ["https://www.css-snacks.com/static-1"],
      sitemapUrl: "https://www.css-snacks.com/sitemap.xml",
      intakeCsvPath: "/fake/path/legacy-urls.csv",
    };

    // 1. Mock FS for CSV
    (fs.existsSync as Mock).mockReturnValue(true);
    (fs.readFileSync as Mock).mockReturnValue(`https://www.css-snacks.com/csv-1
https://www.css-snacks.com/csv-2,some-other-column
invalid-url-skip
https://www.css-snacks.com/static-1`); // Testing overlap with static

    // 2. Mock Fetch for Sitemap
    const mockSitemap = `
      <?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://www.css-snacks.com/sitemap-1</loc></url>
        <url><loc>https://www.css-snacks.com/csv-1</loc></url>
      </urlset>
    `;
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      text: async () => mockSitemap,
    });

    const result = await runDiscovery(fakeConfig);

    // Unique URLs expected:
    // static-1 (from static + csv)
    // csv-1 (from csv + sitemap)
    // csv-2 (from csv)
    // sitemap-1 (from sitemap)
    // Total processed = 4

    expect(result.totalProcessed).toBe(4);
    expect(result.totalInserted).toBe(4);

    // Verify DB
    const rows = db.prepare("SELECT url FROM url_queue").all() as any[];
    expect(rows).toHaveLength(4);

    const urls = rows.map((r) => r.url);
    expect(urls).toContain("https://www.css-snacks.com/static-1");
    expect(urls).toContain("https://www.css-snacks.com/csv-1");
    expect(urls).toContain("https://www.css-snacks.com/csv-2");
    expect(urls).toContain("https://www.css-snacks.com/sitemap-1");
  });

  it("handles ON CONFLICT smoothly when discovering the same site twice", async () => {
    const fakeConfig = {
      staticUrlList: ["https://www.css-snacks.com/static-1"],
      sitemapUrl: "https://www.css-snacks.com/sitemap.xml",
      intakeCsvPath: "/fake/path/legacy-urls.csv",
    };
    (fs.existsSync as Mock).mockReturnValue(false);

    const mockSitemap = `
      <urlset><url><loc>https://www.css-snacks.com/sitemap-1</loc></url></urlset>
    `;
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      text: async () => mockSitemap,
    });

    // Run Once
    const r1 = await runDiscovery(fakeConfig);
    expect(r1.totalProcessed).toBe(2); // static1 + sitemap1
    expect(r1.totalInserted).toBe(2);

    // Run Twice
    const r2 = await runDiscovery(fakeConfig);
    expect(r2.totalProcessed).toBe(2);
    expect(r2.totalInserted).toBe(0); // None should be inserted, CONFLICT handled gracefully

    // Assert DB Size
    const count = db
      .prepare("SELECT count(*) as c FROM url_queue")
      .get() as any;
    expect(count.c).toBe(2);
  });
});
