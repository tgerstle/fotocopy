import * as cheerio from "cheerio";
import { db, updateStatus } from "../state_db";
import { UrlRecord } from "../types/state";
import * as fs from "fs";
import * as path from "path";

export interface SelectorMap {
  [key: string]: string;
}

export function bulkExtractCluster(
  clusterId: string,
  selectors: SelectorMap,
  liveCaptureDir: string,
  hydrationDir: string,
) {
  // Get all remaining URLs for this specific cluster structure
  const urls = db
    .prepare(
      `SELECT * FROM url_queue WHERE cluster_id = ? AND status = 'CRAWLED'`,
    )
    .all(clusterId) as UrlRecord[];

  if (!fs.existsSync(hydrationDir)) {
    fs.mkdirSync(hydrationDir, { recursive: true });
  }

  for (const record of urls) {
    const cleanUrl =
      record.url.replace(/https?:\/\//, "").replace(/[\/\\]/g, "_") || "index";
    const htmlFile = path.join(liveCaptureDir, `${cleanUrl}_dom.html`);

    if (!fs.existsSync(htmlFile)) {
      console.warn(
        `[Bulk Extractor] Missing HTML file for ${record.url} at ${htmlFile}`,
      );
      continue;
    }

    const rawHtml = fs.readFileSync(htmlFile, "utf-8");
    const $ = cheerio.load(rawHtml);
    const extractedData: Record<string, string> = {};

    for (const [field, selector] of Object.entries(selectors)) {
      extractedData[field] = $(selector).text().trim();
    }

    // Save generated fast JSON Payload
    const outputPath = path.join(hydrationDir, `${cleanUrl}_cms.json`);
    fs.writeFileSync(outputPath, JSON.stringify(extractedData, null, 2));

    // Update local status to HYDRATED directly bypassing the LLM phases
    updateStatus(record.id, "HYDRATED");
  }

  return urls.length;
}
