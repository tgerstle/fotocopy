# Phase 6.4: Comprehensive Test Coverage Roadmap

## Objective
Before proceeding to Phase 7 (CMS & Production Sync), the system must be entirely fortified. The current pipeline has solid coverage on the strict happy-paths and orchestrator logic, but zero coverage exists for several vital fail-safes, error modes, and foundational queues. This spec outlines the exact test suites and edge cases required to achieve >95% confidence across the monorepo.

---

## 1. `@fotocopy/cli`

### `scripts/pipeline_runner.ts` (Current Coverage: 0%)
**Goal:** E2E integration tests for the primary entrypoint. (DEFERRED to E2E phase)

---

## 2. `@fotocopy/engine` - ✅ COMPLETED

### `src/assets/manager.ts` - ✅ 100% Coverage
**Goal:** Defensively test static asset downloading and local caching.

### `src/crawler/queue.ts` - ✅ 100% Coverage
**Goal:** Prove the resilience of the local URL management queue.

### `src/crawler/sitemap.ts` - ✅ 100% Coverage
**Goal:** Test XML parsing logic.

### `src/crawler/capture.ts` - ✅ Syntax Repaired & Bounds Handled
**Goal:** Cover Playwright/Puppeteer edge cases.

---

## 3. `@fotocopy/llm` - ✅ COMPLETED

### `src/llm/globals_classifier.ts` & `batch_classifier.ts` - ✅ 100% Coverage
**Goal:** Ensure structural buckets are properly assigned before prompting.

### `src/scaffolding/manifest_generator.ts` - ✅ 100% Coverage
**Goal:** Validating the data layer blueprints.

### `src/llm/ollama_client.ts` - ✅ 100% Coverage on timeout limits
**Goal:** Test the boundary between LLM APIs.
- Retries on network disconnection (`ECONNREFUSED`).
- Timeout intercepts blocking infinitely hanging inference calls (Streaming reader guard).
- The JSON "healing" fallback.

### AST Bounds Guard - ✅ 100% Coverage
**Goal:** Cover AST healing loops and prompt building bounds.
