# Phase 5: Site-Wide Orchestration & State Management (Overview)

## Objective

To scale the pipeline from a single target URL to an entire 10,000+ page website without overwhelming API rate limits, failing midway through 10-hour operations, or losing track of processing state.

## Core Concepts

### 1. Dry-Run Spidering (Discovery vs. Extraction)

- **Concept:** We do not run full Playwright visual/LLM captures on every page blindly.
- **Mechanism:** A lightweight spider process first aggressively crawls the domain to strictly catalog site taxonomy and fetch raw HTML to analyze structure headers.
- **Goal:** Build the complete URL map and begin grouping structurally similar paths before kicking off intensive layout bounding box calculations.

### 2. Local State Store (SQLite Tracking)

- **Concept:** In-memory queueing or flat JSON tracking breaks at scale or upon terminal termination.
- **Mechanism:** We introduce a local SQLite state database (`migration_state.db`).
- **Data Model:**
  - Every discovered URL is logged as a row.
  - Included columns: `pathname`, `status` (`DISCOVERED`, `CRAWLED`, `HASHED`, `CLASSIFIED`, `HYDRATED`, `FAILED`), and `retry_count`.
- **Goal:** True fault tolerance. Downstream scripts (Crawler, LLM chunks) query the SQLite DB for `status = 'PENDING_X'` limit blocks. If the user hits `CTRL+C` or a process runs out of RAM, restarting the terminal gracefully picks up the exact URL it left off on.

### 3. Concurrency Limits & Queueing

- **Concept:** Scaling requires controlling backpressure.
- **Mechanism:** Leveraging tools like `p-limit` internally and strictly batching SQL queries, pipeline processes grab URLs in chunks of 5-10, process the data, and update the row status. This maintains low memory overhead during extended runs.

### 4. Unified Execution Approach (Scale-Agnostic)

- **Concept:** The pipeline uses the exact same logic, disk I/O, and tracking mechanisms regardless of whether it is scanning 1 URL or 10,000 URLs. This ensures a single page run acts as a perfect regression test for the full site engine.
- **Mechanism:** The CLI (`pipeline_runner.ts`) dictates the initial queue seeding. If invoked with `--target-url`, it inserts a single URL into SQLite and immediately triggers the phase loop. If invoked without it, it triggers the Spider to enqueue thousands of URLs before looping. The underlying worker functions remain identical and strictly file-system/database-bound.

### 5. Contextual Execution & Package Isolation

- **Concept:** The pipeline engine is entirely decoupled from the target project config. It acts as a global, path-agnostic CLI tool (the "Playground" model).
- **Mechanism:** The pipeline runner accepts an optional `[output-dir]`. If omitted when using `--target-url`, it intelligently infers a directory from the domain to live cleanly inside an output folder (e.g., `./output/css-snacks.com`). It creates `.fotocopy/migration_state.db` within this workspace and dynamically imports `fotocopy.config.ts`.
- **Goal:** Zero hardcoded paths. Developers can run `npx tsx scripts/pipeline_runner.ts` against `./output/css-snacks.com`, `./output/stripe.com`, or any arbitrary workspace without editing internal engine source files.
