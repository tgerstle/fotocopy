import * as fs from "fs/promises";
import * as path from "path";
import { classifyChunk } from "./ollama_client";
import { ComponentIntentSchema } from "./batch_classifier";

async function main() {
  const filePath = path.resolve(__dirname, "../../../core/output/usmailsupply.com/fotocopy-metadata/chunks/usmailsupply.com_/chunk_03.json");
  const rawData = await fs.readFile(filePath, "utf-8");
  const output = await classifyChunk(rawData, ComponentIntentSchema);
  console.log("LLM Classification Output (Chunk 03):");
  console.log(JSON.stringify(output, null, 2));
}

main().catch(console.error);
