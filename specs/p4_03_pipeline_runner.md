# Phase 4, Step 3: Global Pipeline Orchestrator (CLI Runner)

**Goal:** Create a single, unified Node.js executable (\`scripts/runner.ts\`) that acts as the master conductor for the entire backend data extraction and structure engine. It must seamlessly string together Phases 1 through 4 over a list of discovered URLs.

## 1. Execution Flow

The Orchestrator will read the global configuration and the URL intake manifest, then systematically execute the pipeline stages:

### Step 1: Initialization & URL Intake

- Reads \`fotocopy.config.ts\`.
- Checks for \`sitemapUrl\` in config. If present, runs the \`sitemap.ts\` parser to dynamically harvest legacy paths.
- Reads \`data/legacy-urls.csv\`.
- Validates the intake array and creates necessary base \`output/\` directories.

### Step 2: Phase 1 (Live Crawl & Snapshot)

- Loops through the CSV URLs.
- Executes \`crawlAndCapture()\` sequentially or in small parallel batches.
- Outputs physical \`\_dom.html\`, \`\_geometry.json\`, and \`\_tokens.json\` artifacts into \`output/live_capture/\`.
- _Wait state: Ensure all pages are fully captured before Phase 2._

### Step 3: Phase 2 (Geometry, Intersection, & Slicing)

- Reads the global geometry snapshots and computes structural signatures.
- (Future): Calculates intersecting global layouts (Headers/Footers).
- Slices the remaining page-specific geometries into isolated chunk files in \`output/chunks/\`.

### Step 4: Phase 3 (LLM Discovery & Hydration)

- Invokes \`processChunks()\` (\`batch_classifier.ts\`) taking the sliced \`output/chunks/\` and passing them through the \`p-limit\` restricted local Ollama instances.
- Passes the LLM identity pointer payloads into \`hydrator.ts\`, producing final sanitized CMS blueprint configs inside \`output/hydration/\`.
- Runs \`consolidateComponents()\` to merge all structural permutations into the master \`fotocopy.components.json\` manifest.

### Step 5: Phase 4 (Scaffolding Automation)

- Invokes \`generatePrompts()\` using the consolidated component manifest and the W3C tokens.
- Deposits perfect GitHub Copilot instructions (\`\*.prompt.md\`) into \`output/prompts/\` for the engineering phase.

## 2. Technical Implementation Details

Create \`scripts/runner.ts\`:

- Must support resuming (skipping Phase 1 artifacts that already exist to save time on rerun).
- Include standard console readouts (e.g., heavily utilizing \`console.time\` and \`console.timeEnd\` to benchmark pipeline performance).

**CLI Invocation:**
\`\`\`bash
npx tsx scripts/runner.ts
\`\`\`

## 3. Verification & Metrics

- After execution, manually confirm \`output/prompts/\` generates accurately for \`css-snacks.com\`.
- Assert that there are no unhandled Promise rejections and that memory usage remains stable (enforced by Phase 3 limits).
