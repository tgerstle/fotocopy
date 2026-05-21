import * as fs from "fs/promises";
import * as path from "path";

export interface ComponentDefinition {
  matches: string[];
  schema: Record<string, string>;
}

export type ComponentsManifest = Record<string, ComponentDefinition>;

export async function consolidateComponents(
  outputDir: string,
  manifestPath: string,
): Promise<ComponentsManifest> {
  const files = await fs.readdir(outputDir);
  const jsonFiles = files.filter((f) => f.endsWith(".json"));

  const registry = new Map<string, Set<string>>();

  for (const file of jsonFiles) {
    const filePath = path.join(outputDir, file);
    try {
      const data = JSON.parse(await fs.readFile(filePath, "utf-8"));
      // Assuming CMSPageData structure where layout is an array of blocks
      if (data && data.layout && Array.isArray(data.layout)) {
        for (const block of data.layout) {
          const type = block.inferredBlockType;
          if (type && type !== "N/A" && type !== "Unknown") {
            if (!registry.has(type)) {
              registry.set(type, new Set());
            }
            if (block.mappings) {
              const keys = Object.keys(block.mappings);
              keys.forEach((k) => registry.get(type)!.add(k));
            }
          }
        }
      }
    } catch (e) {
      console.warn(`Could not read or parse ${file}:`, e);
    }
  }

  const manifest: ComponentsManifest = {};

  // Basic grouping: in a real scenario we could ask the LLM to cluster these.
  // For now, we just output the native types found.
  for (const [type, keys] of registry.entries()) {
    const schemaShape: Record<string, string> = {};
    keys.forEach((k) => {
      schemaShape[k] = "string"; // simplistic inference
    });

    manifest[type] = {
      matches: [type], // To be populated with synonyms if clustered
      schema: schemaShape,
    };
  }

  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`Consolidated ${registry.size} components into ${manifestPath}`);
  return manifest;
}

if (require.main === module) {
  (async () => {
    try {
      await consolidateComponents(
        path.join(__dirname, "../../output"),
        path.join(__dirname, "../../fotocopy.components.json"),
      );
    } catch (e) {
      console.error("Consolidation failed:", e);
    }
  })();
}
