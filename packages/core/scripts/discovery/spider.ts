import { db } from "../state_db";
import * as fs from "fs";
import * as cheerio from "cheerio";

export async function runDiscovery(fotocopyConfig: any) {
  const discoveredUrls = new Set<string>([
    ...(fotocopyConfig.staticUrlList || []),
  ]);

  // 1. Parse CSV if exists
  if (
    fotocopyConfig.intakeCsvPath &&
    fs.existsSync(fotocopyConfig.intakeCsvPath)
  ) {
    const csvContent = fs.readFileSync(fotocopyConfig.intakeCsvPath, "utf-8");
    const lines = csvContent
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // Assuming CSV might have header or simple single column
    for (const line of lines) {
      const url = line.split(",")[0];
      if (url.startsWith("http")) {
        discoveredUrls.add(url);
      }
    }
  }

  // 2. Fetch Sitemap via Cheerio XML parser
  if (fotocopyConfig.sitemapUrl) {
    try {
      const response = await fetch(fotocopyConfig.sitemapUrl);
      if (response.ok) {
        const sitemapXml = await response.text();
        const $ = cheerio.load(sitemapXml, { xmlMode: true });

        $("loc").each((_, el) => {
          const url = $(el).text().trim();
          if (url.startsWith("http")) {
            discoveredUrls.add(url);
          }
        });
      }
    } catch (e) {
      console.error(
        `Warning: Failed to fetch or parse sitemap at ${fotocopyConfig.sitemapUrl}`,
        e,
      );
    }
  }

  // 3. Batch Insert to SQLite safely overlapping existing URLs
  const insertStmt = db.prepare(`
    INSERT INTO url_queue (url, pathname, status) 
    VALUES (?, ?, 'DISCOVERED') 
    ON CONFLICT(url) DO NOTHING
  `);

  const insertMany = db.transaction((urls: string[]) => {
    let insertedCount = 0;
    for (const url of urls) {
      try {
        const pathname = new URL(url).pathname;
        const info = insertStmt.run(url, pathname);
        if (info.changes > 0) insertedCount++;
      } catch (e) {
        // Skip invalid URL strings natively
      }
    }
    return insertedCount;
  });

  const totalInserted = insertMany(Array.from(discoveredUrls));
  console.log(
    `Discovery complete. Processed ${discoveredUrls.size} endpoints. Inserted ${totalInserted} new URLs.`,
  );

  return {
    totalProcessed: discoveredUrls.size,
    totalInserted,
  };
}
