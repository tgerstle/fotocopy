import * as fs from "fs/promises";
import * as path from "path";
import * as cheerio from "cheerio";
import crypto from "crypto";
import {
  computeGlobalIntersections,
  getStructuralSignature,
} from "./hash_engine";
import { sliceIntoChunks, CapturedNode } from "./chunk_slicer";

/**
 * Executes the Purge pipeline:
 * 1. Computes mathematical globals across HTML captures.
 * 2. Purges those nodes from the captured geometry arrays.
 * 3. Chunks the sanitized geometry arrays.
 */
export async function executePurgeAndSlice(
  htmlCaptureDir: string,
  geometryCaptureDir: string,
  outputChunksDir: string,
) {
  // Step 1: Compute global intersection signatures from the raw HTML files
  const manifest = await computeGlobalIntersections(htmlCaptureDir, 0.9);

  // Save global manifest for debugging / downstream referencing
  await fs.mkdir(outputChunksDir, { recursive: true });
  await fs.writeFile(
    path.join(outputChunksDir, "globals_manifest.json"),
    JSON.stringify(manifest, null, 2),
  );

  // Step 2: Iterate over every geometry file to purge and slice
  const geomFiles = (await fs.readdir(geometryCaptureDir)).filter((f) =>
    f.endsWith("_geometry.json"),
  );

  for (const file of geomFiles) {
    const rawData = await fs.readFile(
      path.join(geometryCaptureDir, file),
      "utf-8",
    );
    const nodeMap: CapturedNode[] = JSON.parse(rawData);

    // Filter out node footprints that match global thresholds
    // But since the geometry JSON doesn't contain the full Cheerio DOM topology hashing currently...
    // WAIT: The spec says to remove nodes from the DOM tree that match those global hashes.
    // In our pipeline, geometry is an array of shallow nodes.
    // So to correctly purge `nodeMap.json`, we either need to:
    // A) Traverse the HTML Cheerio DOM, find the matching node ID (since we injected data-awa-id),
    //    and then filter the JSON array based on IDs.
    // Let's implement this rigorous binding.

    const htmlFileName = file.replace("_geometry.json", "_dom.html");
    const htmlData = await fs.readFile(
      path.join(htmlCaptureDir, htmlFileName),
      "utf-8",
    );

    const $ = cheerio.load(htmlData);
    const nodesToRemoveIds = new Set<number>();

    // We do exactly what the Global Intersection did to find matches
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

      // If this is a global element, flag its exact awa-id AND all its children awa-ids for removal
      if (manifest.globalHashes.includes(hash)) {
        const idStr = $(el).attr("data-awa-id");
        if (idStr) nodesToRemoveIds.add(parseInt(idStr));

        $(el)
          .find("[data-awa-id]")
          .each((_, child) => {
            const cId = $(child).attr("data-awa-id");
            if (cId) nodesToRemoveIds.add(parseInt(cId));
          });
      }
    });

    // Cleanse array
    const purgedNodeMap = nodeMap.filter(
      (node) => !nodesToRemoveIds.has(node.id),
    );

    // Step 3: Run the chunk slicer on the sanitized content
    const chunks = sliceIntoChunks(purgedNodeMap);

    // Save outputs
    const pageRoute = file.replace("_geometry.json", "");
    const pageOutDir = path.join(outputChunksDir, pageRoute);
    await fs.mkdir(pageOutDir, { recursive: true });

    for (let i = 0; i < chunks.length; i++) {
      const chunkName = `chunk_${String(i + 1).padStart(2, "0")}.json`;
      await fs.writeFile(
        path.join(pageOutDir, chunkName),
        JSON.stringify(chunks[i], null, 2),
      );
    }
  }

  return manifest;
}

export async function purgeAndSlicePage(
  htmlFilePath: string,
  geometryFilePath: string,
  outputChunksDir: string,
  manifest: { globalHashes: string[] }
) {
  const rawData = await fs.readFile(geometryFilePath, "utf-8");
  const nodeMap: CapturedNode[] = JSON.parse(rawData);

  const htmlData = await fs.readFile(htmlFilePath, "utf-8");
  const $ = cheerio.load(htmlData);
  const nodesToRemoveIds = new Set<number>();

  $("body > *, header, footer, nav, [class*='header'], [class*='footer']").each((_, el) => {
    if (el.name.toUpperCase() === "SCRIPT" || el.name.toUpperCase() === "STYLE") return;
    const sig = getStructuralSignature(el, $);
    if (sig.length < 15) return;
    const hash = crypto.createHash("sha256").update(sig).digest("hex");
    if (manifest.globalHashes.includes(hash)) {
      const idStr = $(el).attr("data-awa-id");
      if (idStr) nodesToRemoveIds.add(parseInt(idStr));
      $(el).find("[data-awa-id]").each((_, child) => {
        const cId = $(child).attr("data-awa-id");
        if (cId) nodesToRemoveIds.add(parseInt(cId));
      });
    }
  });

  const purgedNodeMap = nodeMap.filter((node) => !nodesToRemoveIds.has(node.id));
  const chunks = sliceIntoChunks(purgedNodeMap);

  const pageRoute = path.basename(geometryFilePath).replace("_geometry.json", "");
  const pageOutDir = path.join(outputChunksDir, pageRoute);
  await fs.mkdir(pageOutDir, { recursive: true });

  for (let i = 0; i < chunks.length; i++) {
    const chunkName = `chunk_${String(i + 1).padStart(2, "0")}.json`;
    await fs.writeFile(
      path.join(pageOutDir, chunkName),
      JSON.stringify(chunks[i], null, 2)
    );
  }
}
