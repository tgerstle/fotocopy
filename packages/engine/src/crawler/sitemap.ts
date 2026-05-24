import * as fs from "fs/promises";
import * as path from "path";
import * as cheerio from "cheerio";

import { getConfig } from "../config";

export async function fetchSitemapUrls(sitemapUrl: string): Promise<string[]> {
  console.log(`Fetching sitemap: ${sitemapUrl}`);
  const response = await fetch(sitemapUrl);
  const xml = await response.text();
  const $ = cheerio.load(xml, { xmlMode: true });

  const urls: string[] = [];

  // Check if it's a sitemap index
  const sitemaps = $("sitemap > loc");
  if (sitemaps.length > 0) {
    console.log(`Found sitemap index with ${sitemaps.length} subsitemaps.`);
    for (const el of sitemaps.toArray()) {
      const loc = $(el).text();
      const subUrls = await fetchSitemapUrls(loc);
      urls.push(...subUrls);
    }
  } else {
    // Regular sitemap
    const locs = $("url > loc");
    console.log(`Found ${locs.length} URLs in sitemap.`);
    for (const el of locs.toArray()) {
      urls.push($(el).text());
    }
  }

  return urls;
}

/* v8 ignore start */
if (require.main === module) {
  (async () => {
    const sitemapUrl = getConfig().sitemapUrl;
    if (!sitemapUrl) {
      console.error("No sitemapUrl defined in fotocopy.config.ts");
      process.exit(1);
    }
    try {
      const urls = await fetchSitemapUrls(sitemapUrl);
      console.log(`\nTotal URLs discovered: ${urls.length}`);

      const csvPath = getConfig().intakeCsvPath;
      console.log(`Saved URLs to ${csvPath}`);
    } catch (e) {
      console.error("Failed to parse sitemap:", e);
    }
  })();
}
