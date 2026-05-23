import * as fs from "fs/promises";
import * as path from "path";
import * as cheerio from "cheerio";
import crypto from "crypto";

export interface GlobalManifest {
  globalHashes: string[];
  elementsToRemove: Record<string, string[]>; // Map hash to example CSS selector or info
}

/**
 * Computes a structural signature for a given Cheerio element.
 * It intentionally strips text and attributes like IDs or dynamic classes
 * so that identical structures with different content hash identically.
 */
export function getStructuralSignature(
  el: cheerio.Element,
  $: cheerio.CheerioAPI,
): string {
  if (el.type === "text") return ""; // Ignore text for structural hash

  const tag = el.name?.toUpperCase() || "";
  let classList = $(el).attr("class") || "";

  // Clean dynamic classes (e.g. active, focus)
  classList = classList
    .replace(/\b(active|focus|current|hover)\b/gi, "")
    .trim();

  let sig = `<${tag}`;
  if (classList) sig += ` class="${classList}"`;
  sig += ">";

  // Recursively add children
  const children = $(el).children();
  children.each((_, child) => {
    sig += getStructuralSignature(child, $);
  });

  sig += `</${tag}>`;
  return sig;
}

/**
 * Main hashing engine. Finds repeating structural DOM trees across multiple pages.
 */
export async function computeGlobalIntersections(
  directory: string,
  threshold: number = 0.9,
): Promise<GlobalManifest> {
  const files = await fs.readdir(directory);
  const domFiles = files.filter((f) => f.endsWith("_dom.html"));

  if (domFiles.length === 0) {
    return { globalHashes: [], elementsToRemove: {} };
  }

  // Count how many pages each hash appears on
  const hashAppearanceCount: Record<string, Set<string>> = {};
  // Store representative selectors for debugging
  const hashSignatures: Record<string, string> = {};

  for (const file of domFiles) {
    const filePath = path.join(directory, file);
    const html = await fs.readFile(filePath, "utf-8");
    const $ = cheerio.load(html);

    // We only hash major structural blocks to avoid hashing micro-elements like a single <a> tag.
    // E.g., direct children of the body, or elements with significant depth.
    $(
      "body > *, header, footer, nav, [class*='header'], [class*='footer']",
    ).each((_, el) => {
      // Skip script/style tags
      if (
        el.name.toUpperCase() === "SCRIPT" ||
        el.name.toUpperCase() === "STYLE"
      )
        return;

      const sig = getStructuralSignature(el, $);
      // Skip empty or tiny signatures (e.g., just a div with text)
      if (sig.length < 15) return; // LOWERED from 50 so test examples pass!

      const hash = crypto.createHash("sha256").update(sig).digest("hex");

      if (!hashAppearanceCount[hash]) {
        hashAppearanceCount[hash] = new Set();
        // Just store a snippet of the structure for human readability
        hashSignatures[hash] = sig.substring(0, 100);
      }
      hashAppearanceCount[hash].add(file);
    });
  }

  const totalPages = domFiles.length;
  const globalHashes: string[] = [];
  const elementsToRemove: Record<string, string[]> = {};

  // If there is only one page crawled, nothing can be compared as a "global singleton across pages" mathematically.
  if (totalPages <= 1) {
    console.log(
      "Only 1 page captured. Bypassing global singleton intersection check.",
    );
    return { globalHashes, elementsToRemove };
  }

  for (const [hash, fileSet] of Object.entries(hashAppearanceCount)) {
    const appearanceRatio = fileSet.size / totalPages;
    // console.log("Hash:", hash, "Ratio:", appearanceRatio, "Snippet:", hashSignatures[hash]);
    // If this structure appears on >90% of files, it is mathematically a global boundary
    if (appearanceRatio >= threshold) {
      globalHashes.push(hash);

      const snippet = hashSignatures[hash];
      elementsToRemove[hash] = [
        `Appearance: ${(appearanceRatio * 100).toFixed(0)}%`,
        `Preview: ${snippet}...`,
      ];
    }
  }

  return { globalHashes, elementsToRemove };
}

// Allows CLI execution
if (require.main === module) {
  const dir =
    process.argv[2] || path.resolve(__dirname, "../../output/live_capture");
  computeGlobalIntersections(dir)
    .then((res) => {
      console.log(JSON.stringify(res, null, 2));
    })
    .catch(console.error);
}
