import * as cheerio from "cheerio";
import crypto from "crypto";
import { getStructuralSignature } from "./hash_engine";

export interface PageTopology {
  url: string;
  html: string;
}

export interface TemplateCluster {
  templateName: string;
  urlPattern: string;
  matchingUrls: string[];
}

/**
 * Strips out global elements (simulated by dropping nav/footer for this test)
 * and computes a structural hash of the remaining inner <body> content.
 */
function computeInnerHash(html: string): string {
  const $ = cheerio.load(html);
  
  // Simulate the subtraction of global elements mathematically discovered in Step 2.
  // In a real pipeline, we pass the `globalHashes` array and drop matching nodes.
  $("nav, header, footer, .global-header, .global-footer").remove();

  // Now hash the remaining body content
  const body = $("body").get(0);
  if (!body) return "";

  const sig = getStructuralSignature(body, $);
  return crypto.createHash("sha256").update(sig).digest("hex");
}

/**
 * Extracts a generic route prefix. e.g., "/news/2026/hello" -> "/news"
 */
function getRoutePrefix(url: string): string {
  try {
    const parsed = new URL(url, "http://localhost");
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts.length > 0 ? `/${parts[0]}` : "/";
  } catch {
    const parts = url.split("/").filter(Boolean);
    return parts.length > 0 ? `/${parts[0]}` : "/";
  }
}

/**
 * Infers CMS Collections/Templates based on URL topology and Structural topology.
 */
export function inferTemplates(
  pages: PageTopology[],
  minClusterSize: number = 2
): TemplateCluster[] {
  // Map of URL Prefix -> { structuralHash -> URLs }
  const clusters: Record<string, Record<string, string[]>> = {};

  for (const page of pages) {
    const prefix = getRoutePrefix(page.url);
    const innerHash = computeInnerHash(page.html);

    if (!clusters[prefix]) {
      clusters[prefix] = {};
    }
    if (!clusters[prefix][innerHash]) {
      clusters[prefix][innerHash] = [];
    }
    
    clusters[prefix][innerHash].push(page.url);
  }

  const results: TemplateCluster[] = [];

  for (const [prefix, hashGroups] of Object.entries(clusters)) {
    // If prefix is root, it's usually ad-hoc pages (Home, About). 
    // We only cluster sub-directories into Collections.
    if (prefix === "/") continue;

    for (const [hash, urls] of Object.entries(hashGroups)) {
      if (urls.length >= minClusterSize) {
        // e.g., We have a reliable CMS Collection!
        const templateName = `${prefix.replace("/", "").toUpperCase()}_COLLECTION`;
        results.push({
          templateName,
          urlPattern: `${prefix}/*`,
          matchingUrls: urls,
        });
      }
    }
  }

  return results;
}
