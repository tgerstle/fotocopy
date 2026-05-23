import * as fs from "fs/promises";
import * as path from "path";
import { crawlAndCapture } from "./capture";
import { fotocopyConfig } from "../../../../fotocopy.config";

// Phase 1, Step 5: URL Discovery
async function runIntakeQueue() {
  const csvPath = fotocopyConfig.intakeCsvPath;
  const outputDir = fotocopyConfig.outputDir;

  console.log(`Reading Intake CSV at: ${csvPath}`);
  const csvContent = await fs.readFile(csvPath, "utf-8");

  // Very basic CSV parser
  const lines = csvContent.split("\n").filter((l) => l.trim() !== "");
  const header = lines.shift();

  const urls = lines.map((line) => line.trim());
  console.log(`Found ${urls.length} URLs in queue.`);

  for (const url of urls) {
    console.log(`\n===================`);
    console.log(`Orchestrating crawl for: ${url}`);
    try {
      await crawlAndCapture({ url, outputDir });
      console.log(`Success: Target completed.`);
    } catch (err) {
      console.error(`Failed to ingest ${url}:`, err);
    }
  }

  console.log(`\n===================`);
  console.log(
    `Intake Queue complete! Phase 1 Orchestrator successfully finished.`,
  );
}

if (require.main === module) {
  runIntakeQueue();
}
