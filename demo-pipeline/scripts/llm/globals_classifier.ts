import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import { classifyChunk } from "./ollama_client";
import pLimit from "p-limit";
import { fotocopyConfig } from "../../../fotocopy.config";

export const GlobalIntentSchema = z.object({
  inferredBlockType: z
    .string()
    .describe("e.g. SiteHeader, AppFooter, SideNav, SitewideSearch"),
});

export type GlobalIntent = z.infer<typeof GlobalIntentSchema>;

export async function classifyGlobals(
  manifestPath: string,
  outputFile: string,
  maxConcurrency: number = 2
): Promise<Record<string, GlobalIntent>> {
  const raw = await fs.readFile(manifestPath, "utf-8");
  const data = JSON.parse(raw);
  
  if (!data.elementsToRemove) {
    return {};
  }

  const limit = pLimit(maxConcurrency);
  const results: Record<string, GlobalIntent> = {};

  const tasks = Object.entries(data.elementsToRemove).map(([hash, preview]) =>
    limit(async () => {
      console.log(`Processing global hash ${hash.slice(0, 8)}... via LLM classification...`);
      const previewStr = Array.isArray(preview) ? preview.join("\n") : String(preview);

      const promptReplacement = {
        ...fotocopyConfig.llm,
      };

      try {
        const classification = await classifyChunk(
          previewStr,
          GlobalIntentSchema,
          promptReplacement
        );
        results[hash] = classification;
      } catch (e) {
        console.error(`Failed to classify global ${hash}:`, e);
      }
    })
  );

  await Promise.all(tasks);

  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(outputFile, JSON.stringify(results, null, 2));

  return results;
}
