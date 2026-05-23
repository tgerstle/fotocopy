import { PipelineError } from "@fotocopy/engine";
import { program } from "commander";
import path from "path";
import fs from "fs";
import { runDiscovery, setConfig } from "@fotocopy/engine";
import { crawlAndCapture } from "@fotocopy/engine";
import { computeGlobalIntersections } from "@fotocopy/engine";
import { purgeAndSlicePage } from "@fotocopy/engine";
import { processChunks } from "@fotocopy/llm";
import { classifyGlobals } from "@fotocopy/llm";
import { hydrate } from "@fotocopy/llm";
import { consolidateComponents, extractSampleData } from "@fotocopy/llm";
import { generatePrompts } from "@fotocopy/llm";
import { generateGlobalPrompts } from "@fotocopy/llm";
import {
  db,
  initializeDatabase,
  claimBatch,
  updateStatus,
  handleFailure,
  resetHangingJobs,
} from "@fotocopy/engine";
import { PipelinePhase, UrlRecord } from "@fotocopy/engine";

import { extractSandboxTemplate } from "@fotocopy/llm";
import { injectTokensToCSS } from "@fotocopy/llm";
import { extractTokens } from "@fotocopy/engine";

// Stubs for the actual execution logic we'll wire up later
// In the future, these will wrap the crawler, slicer, LLM, etc.
const buildRunCrawlerPhase =
  (workingDir: string) => async (record: UrlRecord) => {
    console.log(`[CRAWLER] Processing: ${record.url}`);
    const outputDir = path.join(
      workingDir,
      "fotocopy-metadata",
      "live_capture",
    );
    await crawlAndCapture({ url: record.url, outputDir });
  };

const buildRunSlicerPhase =
  (workingDir: string, manifest: { globalHashes: string[] }) =>
  async (record: UrlRecord) => {
    console.log(`[SLICER] Processing: ${record.pathname}`);
    const liveCaptureDir = path.join(
      workingDir,
      "fotocopy-metadata",
      "live_capture",
    );
    const chunksDir = path.join(workingDir, "fotocopy-metadata", "chunks");

    // Convert https://css-snacks.com/ -> css-snacks.com_
    // or https://css-snacks.com/about -> css-snacks.com_about
    const cleanUrl =
      record.url.replace(/https?:\/\//, "").replace(/[\/\\]/g, "_") || "index";
    const htmlFile = path.join(liveCaptureDir, `${cleanUrl}_dom.html`);
    const geomFile = path.join(liveCaptureDir, `${cleanUrl}_geometry.json`);

    if (!fs.existsSync(htmlFile) || !fs.existsSync(geomFile)) {
      throw new Error(`Missing capture files for ${record.url}`);
    }

    await purgeAndSlicePage(htmlFile, geomFile, chunksDir, manifest);
  };

const buildRunClassificationPhase =
  (workingDir: string) => async (record: UrlRecord) => {
    console.log(`[CLASSIFIER] Processing: ${record.pathname}`);
    const chunksDir = path.join(workingDir, "fotocopy-metadata", "chunks");
    const llmOutputDir = path.join(
      workingDir,
      "fotocopy-metadata",
      "llm_outputs",
    );
    if (!fs.existsSync(llmOutputDir)) {
      fs.mkdirSync(llmOutputDir, { recursive: true });
    }

    const cleanUrl =
      record.url.replace(/https?:\/\//, "").replace(/[\/\\]/g, "_") || "index";
    const pageChunksDir = path.join(chunksDir, cleanUrl);
    const pageOutputFile = path.join(llmOutputDir, `${cleanUrl}.json`);

    if (!fs.existsSync(pageChunksDir)) {
      throw new Error(
        `Missing chunk directory for ${record.url} at ${pageChunksDir}`,
      );
    }

    // Call the LLM batch classifier on this page's sliced sub-chunks.
    // Set concurrency to something reasonable depending on the LLM machine limit.
    await processChunks(pageChunksDir, pageOutputFile, 2);
  };

const buildRunHydrationPhase =
  (workingDir: string) => async (record: UrlRecord) => {
    console.log(`[HYDRATOR] Processing: ${record.pathname}`);

    const cleanUrl =
      record.url.replace(/https?:\/\//, "").replace(/[\/\\]/g, "_") || "index";
    const liveCaptureDir = path.join(
      workingDir,
      "fotocopy-metadata",
      "live_capture",
    );
    const llmOutputDir = path.join(
      workingDir,
      "fotocopy-metadata",
      "llm_outputs",
    );
    const hydrationDir = path.join(
      workingDir,
      "fotocopy-metadata",
      "hydration",
    );

    if (!fs.existsSync(hydrationDir))
      fs.mkdirSync(hydrationDir, { recursive: true });

    const domPath = path.join(liveCaptureDir, `${cleanUrl}_dom.html`);
    const llmOutputPath = path.join(llmOutputDir, `${cleanUrl}.json`);
    const tokensPath = path.join(liveCaptureDir, `${cleanUrl}_tokens.json`);
    const cmsOutputPath = path.join(hydrationDir, `${cleanUrl}_cms.json`);

    try {
      if (!fs.existsSync(llmOutputPath)) {
        throw new Error(`Missing LLM file ${llmOutputPath}`);
      }
      const cmsData = await hydrate(domPath, llmOutputPath, tokensPath);
      await fs.promises.writeFile(
        cmsOutputPath,
        JSON.stringify(cmsData, null, 2),
      );
    } catch (error: any) {
      console.error(`Hydration error on ${record.url}:`, error.message);
      throw error;
    }
  };

type PhaseFunction = (record: UrlRecord) => Promise<void>;

/**
 * Generic Batch Processor
 * Claims records of a specific status and runs the phase worker.
 */
async function processBatch(
  phase: PipelinePhase,
  nextPhase: PipelinePhase,
  workerFn: PhaseFunction,
  errorsArg?: PipelineError[],
) {
  let pending = true;
  let processedCount = 0;

  console.log(`\n--- Starting Batch Processing for Phase: ${phase} ---`);

  while (pending) {
    // Atomically claim 5 at a time
    const batch = claimBatch(phase, 5);
    if (batch.length === 0) {
      pending = false;
      break;
    }

    console.log(`> Picked up ${batch.length} items for ${phase}`);

    // Process concurrently but safely limited by the batch size
    const promises = batch.map(async (record: any) => {
      try {
        await workerFn(record);
        // On success, advance to the next phase
        updateStatus(record.id, nextPhase);
        processedCount++;
      } catch (error: any) {
        console.error(
          `[ERROR] Phase ${phase} failed for URL ${record.url}: ${error.message}`,
        );
        if (errorsArg) {
          errorsArg.push({
            phase,
            url: record.url,
            error: error.message || String(error),
          });
        }
        handleFailure(record, phase);
      }
    });

    await Promise.all(promises);
  }

  console.log(
    `--- Finished ${phase}. Processed ${processedCount} items. ---\n`,
  );
}

program
  .argument("[output-dir]", "Directory to store pipeline state and outputs")
  .option(
    "-c, --config <path>",
    "Path to a fotocopy config file (defaults to fotocopy.config.ts in the output directory)",
  )
  .option(
    "--target-url <url>",
    "Run the exact pipeline against a single URL for component extraction",
  )
  .option(
    "-f, --force",
    "Force overwrite existing status to re-run the target URL",
  )
  .option(
    "--run-spider",
    "Seed the local DB from the configured sitemap before processing",
  )
  .parse(process.argv);

const options = program.opts();
const outputDirArg = program.args[0];

async function main() {
  console.log("🤖 FOTOCOPY: Initializing Pipeline Runner");
  const pipelineErrors: PipelineError[] = [];

  let workingDir = outputDirArg;

  if (!workingDir) {
    const callingDir = process.env.INIT_CWD || process.cwd();
    const baseOutputDir = path.join(callingDir, "output");

    // Ensure output directory exists with a .gitkeep
    if (!fs.existsSync(baseOutputDir)) {
      fs.mkdirSync(baseOutputDir, { recursive: true });
      fs.writeFileSync(path.join(baseOutputDir, ".gitkeep"), "");
    }

    if (options.targetUrl) {
      try {
        const hostname = new URL(options.targetUrl).hostname;
        workingDir = path.join(baseOutputDir, hostname); // e.g., ./output/css-snacks.com
      } catch {
        workingDir = baseOutputDir;
      }
    } else {
      workingDir = baseOutputDir;
    }
  } else {
    // Determine where the user actually ran the command from
    const callingDir = process.env.INIT_CWD || process.cwd();
    workingDir = path.resolve(callingDir, workingDir);
  }

  if (!fs.existsSync(workingDir)) {
    fs.mkdirSync(workingDir, { recursive: true });
  }

  // Find and load Fotocopy config if present
  let fotocopyConfig = {};
  const configCallingDir = process.env.INIT_CWD || process.cwd();
  const configPath = options.config
    ? path.resolve(configCallingDir, options.config)
    : path.resolve(configCallingDir, "fotocopy.config.ts"); // Check root workspace first for the demo

  if (fs.existsSync(configPath)) {
    const imported = await import(configPath);
    fotocopyConfig = imported.fotocopyConfig || imported.default || {};
    setConfig(fotocopyConfig);
    console.log(`Loaded configuration from ${configPath}`);
  } else if (options.config) {
    console.warn(`Config file specified but not found at ${configPath}`);
  }

  console.log(`📂 Using Workspace: ${workingDir}`);

  initializeDatabase(workingDir);
  resetHangingJobs(); // Heal jobs interrupted by CTRL+C from previous runs

  if (options.targetUrl) {
    console.log(
      `🎯 SNIPER MODE: Targeting ${options.targetUrl}${options.force ? " (FORCE)" : ""}`,
    );
    const pathname = new URL(options.targetUrl).pathname;
    try {
      if (options.force) {
        db.prepare(
          "INSERT INTO url_queue (url, pathname, status, retry_count) VALUES (?, ?, 'DISCOVERED', 0) ON CONFLICT(url) DO UPDATE SET status='DISCOVERED', retry_count=0",
        ).run(options.targetUrl, pathname);
        console.log(`Force inserted (or reset) target URL in execution queue.`);
      } else {
        db.prepare(
          "INSERT OR IGNORE INTO url_queue (url, pathname, status) VALUES (?, ?, 'DISCOVERED')",
        ).run(options.targetUrl, pathname);
        console.log(
          `Inserted target URL into execution queue (ignored if already complete).`,
        );
      }
    } catch (e: any) {
      console.error(`Invalid URL provided: ${e.message}`);
      process.exit(1);
    }
  } else if (options.runSpider) {
    console.log(`🕸️ SPIDER MODE: Discovering entire site topology`);
    await runDiscovery(fotocopyConfig);
  } else {
    // If no flags are passed, we just run the queue processors
    console.log(
      `⚙️ ORCHESTRATOR MODE: Picking up pending queues from database`,
    );
  }

  // The sequential execution loop
  await processBatch(
    "DISCOVERED",
    "CRAWLED",
    buildRunCrawlerPhase(workingDir),
    pipelineErrors,
  );

  // Compute global intersections before slicing
  console.log(
    "\n🔎 Computing global intersections across all captured pages...",
  );
  const liveCaptureDir = path.join(
    workingDir,
    "fotocopy-metadata",
    "live_capture",
  );
  const chunksDir = path.join(workingDir, "fotocopy-metadata", "chunks");
  if (!fs.existsSync(chunksDir)) fs.mkdirSync(chunksDir, { recursive: true });

  const manifest = fs.existsSync(liveCaptureDir)
    ? await computeGlobalIntersections(liveCaptureDir, 0.9)
    : { globalHashes: [], elementsToRemove: {} };

  fs.writeFileSync(
    path.join(chunksDir, "globals_manifest.json"),
    JSON.stringify(manifest, null, 2),
  );

  await processBatch(
    "CRAWLED",
    "HASHED",
    buildRunSlicerPhase(workingDir, manifest),
    pipelineErrors,
  );
  await processBatch(
    "HASHED",
    "CLASSIFIED",
    buildRunClassificationPhase(workingDir),
    pipelineErrors,
  );

  console.log("\n🔎 Classifying Global Layout footprints (LLM Vision)...");
  const globalsManifestPath = path.join(chunksDir, "globals_manifest.json");
  const globalsResultPath = path.join(
    workingDir,
    "fotocopy-metadata",
    "llm_outputs",
    "llm_globals_map.json",
  );
  if (fs.existsSync(globalsManifestPath)) {
    await classifyGlobals(
      globalsManifestPath,
      globalsResultPath,
      2,
      pipelineErrors,
    );
  }

  await processBatch(
    "CLASSIFIED",
    "HYDRATED",
    buildRunHydrationPhase(workingDir),
    pipelineErrors,
  );

  console.log("\n🔎 Consolidating CMS Schema Manifests and Prompts...");
  const hydrationDir = path.join(workingDir, "fotocopy-metadata", "hydration");
  const promptsDir = path.join(workingDir, "fotocopy-metadata", "prompts");
  const fotocopyComponentsPath = path.join(
    workingDir,
    "fotocopy-metadata",
    "fotocopy.components.json",
  );

  // The Template Compiler Delivery Phase
  console.log(
    "\n📦 Extracting React Template Compiler into output directory...",
  );
  const templateSrc = path.resolve(__dirname, "../templates/react-sandbox");
  const extracted = extractSandboxTemplate(templateSrc, workingDir);
  if (extracted) {
    console.log(`Copied sandbox framework directly into ${workingDir}`);
  }

  // NOTE: Assuming liveCaptureDir has css-snacks.com_tokens.json due to first page, or we grab the first one
  const liveCaptureDirFs = await fs.promises
    .readdir(liveCaptureDir)
    .catch(() => []);
  const firstTokensFile = liveCaptureDirFs.find((f) =>
    f.endsWith("_tokens.json"),
  );
  const primaryTokensPath = firstTokensFile
    ? path.join(liveCaptureDir, firstTokensFile)
    : "";

  if (primaryTokensPath) {
    const rawTokens = JSON.parse(
      await fs.promises.readFile(primaryTokensPath, "utf-8"),
    );
    const semanticTokens = extractTokens(rawTokens);
    const sandboxCssPath = path.join(workingDir, "src/app/globals.css");
    try {
      await injectTokensToCSS(sandboxCssPath, semanticTokens);
      console.log(`Injected semantic tokens into ${sandboxCssPath}`);
    } catch (err: any) {
      console.error(`Failed to inject semantic tokens: ${err.message}`);
    }
  }

  let sampleDataPayload: Record<string, any> = {};
  if (fs.existsSync(hydrationDir)) {
    sampleDataPayload = await extractSampleData(hydrationDir);
  }

  if (fs.existsSync(hydrationDir) && primaryTokensPath) {
    const manifest = await consolidateComponents(
      hydrationDir,
      fotocopyComponentsPath,
    );
    await generatePrompts(
      fotocopyComponentsPath,
      primaryTokensPath,
      promptsDir,
      sampleDataPayload,
      pipelineErrors,
    );
  }

  const globalPromptsDir = path.join(promptsDir, "globals");
  if (
    fs.existsSync(globalsManifestPath) &&
    fs.existsSync(globalsResultPath) &&
    primaryTokensPath
  ) {
    await generateGlobalPrompts(
      globalsManifestPath,
      globalsResultPath,
      primaryTokensPath,
      globalPromptsDir,
      sampleDataPayload,
      pipelineErrors,
    );
  }

  // Note: HYDRATED leads to COMPLETED eventually via CMS/Storybook stages.

  console.log("✅ Pipeline Execution Complete");
  if (pipelineErrors.length > 0) {
    console.log("\n--- ⚠️ PIPELINE ERROR SUMMARY ---");
    pipelineErrors.forEach((err, i) => {
      console.log(
        `${i + 1}. Phase: ${err.phase} | URL: ${err.url}\n   Error: ${err.error}\n`,
      );
    });
  } else {
    console.log("\n--- 🎉 NO ERRORS TRIGGERED ---");
    if (options.targetUrl) {
      console.log(
        `\nTo view your generated components in Storybook, run:\n   pnpm run preview ${new URL(options.targetUrl).hostname.replace(/^www\./, "")}\n`,
      );
    }
  }
}

main().catch((e) => {
  console.error("Fatal Pipeline Error", e);
  process.exit(1);
});
