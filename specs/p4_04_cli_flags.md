# Phase 4, Step 4: Pipeline Observability & CLI Flags

**Goal:** Enhance the Global Pipeline Orchestrator (`scripts/runner.ts`) with Command Line Interface (CLI) flags to allow isolated, step-by-step execution and deep monitoring. This ensures developers can debug artifacts (HTML, Layout JSON, LLM outputs) manually before advancing the pipeline.

## 1. Supported Flags

The orchestrator now accepts the following CLI arguments:

- `--step=<number>`: Isolates execution to a specific phase. Instead of running end-to-end, the pipeline will only execute the specified step and exit. This is critical for validating data handoffs.
  - `--step=1`: Runs URL Intake & Live Crawl (captures HTML, Geography, Tokens).
  - `--step=2`: Runs Geometry Intersection & Slicing (computes chunks & global manifests).
  - `--step=3`: Runs LLM Discovery & Hydration (processes chunks via Ollama and outputs `fotocopy.components.json`).
  - `--step=4`: Runs Scaffolding Automation (generates `.prompt.md` files).
  - *If omitted, the orchestrator runs all steps sequentially (default behavior).*

- `--verbose`: Enables detailed logging outputs across the pipeline. This exposes internal node maps, URL array traces, and payload metrics that are normally suppressed to keep the console clean.

## 2. Implementation Logic

Inside `scripts/runner.ts`, arguments are parsed natively from `process.argv`:
1. Loop over `process.argv` looking for `--step=` and `--verbose` properties.
2. Store the `targetStep` as an integer (`0` if not specified) and `isVerbose` as a boolean.
3. Before executing a pipeline phase, wrap logic in: `if (targetStep === 0 || targetStep === N) { ... }`.
4. Wrap deep inspection logs with `if (isVerbose) console.log(...)`.

## 3. Developer Workflow Usage

When an engineer detects an AI hallucination or a corrupted layout:
1. **Pause Pipeline:** Cancel full runs.
2. **Re-run Crawl:** Execute \`npx tsx scripts/runner.ts --step=1 --verbose\` and visually inspect `output/live_capture/` assets to verify the raw HTML snapshot.
3. **Re-run Slicing:** Execute \`npx tsx scripts/runner.ts --step=2\` and review `output/chunks/`.
4. **Re-run Verification:** Resume the pipeline to confirm the fix behaves properly at the boundary.
