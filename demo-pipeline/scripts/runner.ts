import * as fs from "fs/promises";
import * as path from "path";
import { fotocopyConfig } from "../../fotocopy.config";
import { fetchSitemapUrls } from "./crawler/sitemap";
import { crawlAndCapture } from "./crawler/capture";
import { processChunks } from "./llm/batch_classifier";
import { consolidateComponents } from "./llm/consolidator";
import { generatePrompts } from "./scaffolding/prompt_generator";

// Placeholder imports for phase 2 since they were specced but not fully wired yet
import { sliceIntoChunks } from "./intersection/chunk_slicer";
import { executePurgeAndSlice } from "./intersection/orchestrator";

// CLI Parse
const args = process.argv.slice(2);
let targetStep = 0;
let isVerbose = false;

args.forEach((arg) => {
  if (arg.startsWith("--step=")) {
    targetStep = parseInt(arg.split("=")[1], 10);
  }
  if (arg === "--verbose") {
    isVerbose = true;
  }
});

async function logPhase(phaseName: string) {
  console.log(`\n========================================`);
  console.log(`🚀 STARTING ${phaseName}`);
  console.log(`========================================\n`);
}

function verboseLog(...messages: any[]) {
  if (isVerbose) {
    console.log("[VERBOSE]", ...messages);
  }
}

async function run() {
  console.time("Pipeline Total Execution Time");

  if (targetStep > 0) {
    console.log(`🎯 Pipeline focused on Step ${targetStep} only.`);
  }

  // ==== STEP 1: CRAWL & SNAPSHOT ====
  const csvPath = fotocopyConfig.intakeCsvPath;
  const outputCaptureDir = fotocopyConfig.outputDir;

  if (targetStep === 0 || targetStep === 1) {
    logPhase("Step 1: Initialization, URL Intake & Crawl");
    
    await fs.mkdir(path.dirname(csvPath), { recursive: true });

    if (fotocopyConfig.staticUrlList && fotocopyConfig.staticUrlList.length > 0) {
      console.log(`Bypassing sitemap. Using static URL list (${fotocopyConfig.staticUrlList.length} URLs)...`);
      await fs.writeFile(csvPath, fotocopyConfig.staticUrlList.join("\n"));
    } else if (fotocopyConfig.sitemapUrl) {
      console.log(`Fetching dynamic sitemap from ${fotocopyConfig.sitemapUrl}...`);
      const urls = await fetchSitemapUrls(fotocopyConfig.sitemapUrl);
      await fs.writeFile(csvPath, urls.join("\n"));
      console.log(`Saved ${urls.length} URLs to ${csvPath}`);
    }

    const csvText = await fs.readFile(csvPath, "utf-8");
    const urlsToProcess = csvText.split("\n").map(u => u.trim()).filter(Boolean);
    
    if (urlsToProcess.length === 0) {
      console.error("No URLs found to process!");
      process.exit(1);
    }
    verboseLog(`Loaded ${urlsToProcess.length} URLs for processing.`);

    await fs.mkdir(outputCaptureDir, { recursive: true });

    for (const url of urlsToProcess) {
      const cleanUrl = url.replace(/https?:\/\//, "").replace(/[\/\\]/g, "_") || "index";
      const domPath = path.join(outputCaptureDir, `${cleanUrl}_dom.html`);
      
      try {
        await fs.access(domPath);
        console.log(`Skipping capture for ${url} -> Artifacts exist in cache.`);
        verboseLog(`Cached path detected: ${domPath}`);
      } catch {
        console.log(`Executing Crawl -> ${url}`);
        await crawlAndCapture({ url, outputDir: outputCaptureDir });
      }
    }
  }

  // ==== STEP 2: GEOMETRY & SLICING ====
  const chunksDir = path.join(__dirname, "../output/chunks");

  if (targetStep === 0 || targetStep === 2) {
    logPhase("Step 2: Phase 2 (Geometry, Intersection, & Slicing)");
    
    try {
      console.log(`Executing Purge and Slice geometry against ${outputCaptureDir}...`);
      await executePurgeAndSlice(outputCaptureDir, outputCaptureDir, chunksDir);
    } catch(e) {
      console.warn("Phase 2 Orchestrator encountered an issue (mocking fallback):", e);
    }

    // Verify chunks exist
    let chunkFiles: string[] = [];
    try {
      const d = await fs.readdir(chunksDir, { recursive: true });
      chunkFiles = d.filter(f => f.endsWith('.json') && !f.includes('globals')).map(f => String(f));
      verboseLog(`Chunks generated:`, chunkFiles);
    } catch(e) {
      console.log("No chunks found. Creating a synthetic chunk for downstream...");
      await fs.mkdir(chunksDir, { recursive: true });
      await fs.writeFile(path.join(chunksDir, "synthetic_chunk.json"), JSON.stringify({
        id: "synthetic", markup: "<div data-awa-id='1'><h2>Mock Title</h2></div>"
      }));
    }
  }

  // ==== STEP 3: LLM DISCOVERY ====
  const classificationOutput = path.join(__dirname, "../output/hydration/llm_raw_map.json");
  const manifestPath = path.join(__dirname, "../fotocopy.components.json");

  if (targetStep === 0 || targetStep === 3) {
    logPhase("Step 3: Phase 3 (LLM Discovery & Hydration)");
    let chunkFiles: string[] = [];
    
    try {
      const d = await fs.readdir(chunksDir, { recursive: true });
      chunkFiles = d.filter(f => f.endsWith('.json') && !f.includes('globals')).map(f => String(f));
    } catch(e) {
      // ignore
    }
    
    console.log(`Queueing ${chunkFiles.length} chunks to local LLM...`);
    verboseLog(`Executing batch processing to ${classificationOutput}`);
    await processChunks(chunksDir, classificationOutput, 2);

    console.log(`Consolidating Output...`);
    await consolidateComponents(path.join(__dirname, "../output/hydration"), manifestPath);
  }

  // ==== STEP 4: SCAFFOLDING ====
  if (targetStep === 0 || targetStep === 4) {
    logPhase("Step 4: Phase 4 (Scaffolding Automation)");
    
    // We currently just grab the first available tokens file.
    // In production we could merge tokens or target the specific site token file.
    const tokensPath = path.join(outputCaptureDir, "css-snacks.com_tokens.json");
    const promptsDir = path.join(__dirname, "../output/prompts");
    
    try {
      await fs.access(tokensPath);
      verboseLog(`Design tokens loaded from: ${tokensPath}`);
      console.log(`Generating Copilot Prompts using Tokens & Manifest...`);
      await generatePrompts(manifestPath, tokensPath, promptsDir);
    } catch(e) {
      console.warn("Unable to execute template generation due to missing tokens or manifest.");
    }
  }

  console.log(`\n========================================`);
  console.timeEnd("Pipeline Total Execution Time");
  console.log(`✅ EXEUCTION COMPLETE`);
  console.log(`========================================\n`);
}

if (require.main === module) {
  run().catch(console.error);
}
