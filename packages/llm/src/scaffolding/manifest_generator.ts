import * as fs from "fs/promises";
import * as path from "path";
import { hydrate } from "./hydrator";

export async function generateManifests(
  chunksDir: string,
  rawMapPath: string,
  liveCaptureDir: string,
  outputManifestsDir: string,
) {
  await fs.mkdir(outputManifestsDir, { recursive: true });

  const files = await fs.readdir(chunksDir, { recursive: true });
  const jsonFiles = files
    .filter((f) => f.endsWith(".json") && !f.includes("globals"))
    .sort();

  const rawMapRaw = await fs.readFile(rawMapPath, "utf-8");
  const rawMap = JSON.parse(rawMapRaw);

  const pages: Record<string, any[]> = {};

  jsonFiles.forEach((file, index) => {
    const pageSlug = path.dirname(file as string);
    if (!pages[pageSlug]) pages[pageSlug] = [];

    pages[pageSlug].push({
      file,
      classification: rawMap.layout[index],
    });
  });

  for (const [pageSlug, chunks] of Object.entries(pages)) {
    const cleanSlug = pageSlug.replace(/_$/, "");
    const domFilename = `${cleanSlug}__dom.html`; // Check default naming scheme

    let domPath = path.join(liveCaptureDir, domFilename);
    const tokensPath = tempTokensPathCheck(liveCaptureDir);

    let domExists = true;
    try {
      await fs.access(domPath);
    } catch {
      domPath = path.join(liveCaptureDir, `${cleanSlug}_dom.html`); // check single underscore
      try {
        await fs.access(domPath);
      } catch {
        domExists = false;
      }
    }

    if (!domExists) {
      console.warn(`Skipping ${cleanSlug}: DOM file not found.`);
      continue;
    }

    const llmPayload = {
      page_id: cleanSlug,
      blocks: chunks.map((c) => c.classification),
    };

    const tempLlmPath = path.join(
      outputManifestsDir,
      `_temp_${cleanSlug}.json`,
    );
    await fs.writeFile(tempLlmPath, JSON.stringify(llmPayload, null, 2));

    try {
      console.log(`Hydrating manifest for ${cleanSlug}...`);
      const hydratedData = await hydrate(domPath, tempLlmPath, tokensPath);

      const manifestOutPath = path.join(
        outputManifestsDir,
        `${cleanSlug}.json`,
      );
      await fs.writeFile(
        manifestOutPath,
        JSON.stringify(hydratedData, null, 2),
      );
      console.log(`Successfully generated manifest: ${manifestOutPath}`);
    } catch (e) {
      console.error(`Failed to hydrate ${cleanSlug}:`, e);
    } finally {
      await fs.unlink(tempLlmPath).catch(() => {});
    }
  }
}

function tempTokensPathCheck(dir: string) {
  // Temporary workaround for varying token naming between runs
  return path.join(dir, "css-snacks.com_tokens.json");
}
