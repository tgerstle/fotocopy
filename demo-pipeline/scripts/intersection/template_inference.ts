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
 * Strips out global elements using actual globalHashes generated in Step 2.
 * Computes a structural hash of the remaining inner <body> content.
 */
function computeInnerHash(html: string, globalHashes: string[]): string {
  const $ = cheerio.load(html);
  
  // Dynamically remove nodes that match the global footprint
  $(
    "body > *, header, footer, nav, [class*='header'], [class*='footer']",
  ).each((_, el) => {
    if (
      el.name.toUpperCase() === "SCRIPT" ||
      el.name.toUpperCase() === "STYLE"
    )
      return;

    const sig = getStructuralSignature(el, $);
    if (sig.length < 15) return; 

    const hash = crypto.createHash("sha256").update(sig).digest("hex");
    if (globalHashes.includes(hash)) {
      $(el).remove();
    }
  });
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
  globalHashes: string[],
  minClusterSize: number = 2
): TemplateCluster[] {
  // Map of URL Prefix -> { structuralHash -> URLs }
  const clusters: Record<string, Record<string, string[]>> = {};

  for (const page of pages) {
    const prefix = getRoutePrefix(page.url);
    const innerHash = computeInnerHash(page.html, globalHashes);

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
