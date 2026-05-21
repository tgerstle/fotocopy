import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import { classifyChunk } from "./ollama_client";
import pLimit from "p-limit";
import { fotocopyConfig } from "../../../fotocopy.config";

/**
 * Zod Schema strictly describing the Component mapping intent.
 * The LLM behaves as a "Bottom-Up" Architect, inferring the blockType organically
 * based on the visual layout to discover components dynamically.
 * mappings object contains pairs mapping the schema field strictly to a `data-awa-id` pointing back to the raw DOM.
 */
export const ComponentIntentSchema = z.object({
  inferredBlockType: z
    .string()
    .describe("e.g. Hero, Testimonial, StaffGrid, EventList, FAQ"),
  mappings: z.record(z.string()),
});

export type ComponentIntent = z.infer<typeof ComponentIntentSchema>;

interface ChunkData {
  id: string | number;
  markup?: string;
  nodes?: any[];
}

export async function processChunks(
  chunksDir: string,
  outputFile: string,
  maxConcurrency: number = 2,
): Promise<ComponentIntent[]> {
  const files = await fs.readdir(chunksDir, { recursive: true });
  const jsonFiles = files
    .filter((f) => f.endsWith(".json") && !f.includes("globals"))
    .sort();

  const limit = pLimit(maxConcurrency);

  const tasks = jsonFiles.map((file) =>
    limit(async () => {
      const chunkPath = path.join(chunksDir, file);
      const chunkRaw = await fs.readFile(chunkPath, "utf-8");
      const chunkData = JSON.parse(chunkRaw) as ChunkData;

      console.log(`Processing ${file} via LLM classification...`);

      try {
        const payload =
          chunkData.markup || JSON.stringify(chunkData.nodes, null, 2);
        const classification = await classifyChunk(
          payload,
          ComponentIntentSchema,
          fotocopyConfig.llm,
        );
        return classification;
      } catch (e) {
        console.error(`Failed to classify chunk in ${file}:`, e);
        return { inferredBlockType: "Unknown", mappings: {} };
      }
    }),
  );

  const results = await Promise.all(tasks);

  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(outputFile, JSON.stringify({ layout: results }, null, 2));

  return results;
}
