# Phase 3, Step 2: Scale Hydration Engine (`src/llm/batch_classifier.ts` & `hydrator.ts`)

**Goal:** Expand the Tracer Bullet's Hydrator (Phase 0) to production scale. The engine must ingest the physical folder outputs from Phase 2 (Sliced Chunks), submit them asynchronously to the Ollama schema validation endpoint (Phase 3 Step 1), and re-map the resulting pointers directly back to the DOM without hallucination.

## Architectural Decisions

We bifurcate the AI inference completely from the Data Extraction.

1. The **Batch Classifier** translates chunks to structure (`batch_classifier.ts`).
2. The **Hydrator** reads those structures from JSON, extracts strictly using Cheerio, and produces `04_manifest.json` (`hydrator.ts`).

## Execution Flow

1.  **Batch Classifier Iteration:**
    - Reads `/data/sliced_chunks/[route]/` sequentially.
    - Submits the `chunk.markup` to the Ollama Client.
    - Yields `ComponentIntent` JSON objects mapped with data-pointers.
2.  **Pointer De-referencing:**
    - The LLM returns `{ target: "Hero", nodeId: "294" }`.
    - The `hydrator.ts` maps `data-awa-id="294"` inside `nodeMap.json`.
3.  **Literal Assignment:**
    - Using Cheerio against the serialized DOM, the Node backend physically assigns `.text()` and `.attr('src')` into the Payload-ready JSON array.
4.  **Final Asset Composition:**
    - Hydrator injects global `DesignTokens` mapped from CSS into the manifest, exporting `04_manifest.json` for Copilot processing in Phase 4.

## Implementation Status

- [x] Create generic `classifyChunk()` payload formatter for Ollama APIs natively integrated (`ollama_client.ts`).
- [x] Expand inference iteration script to loop over file structures (`batch_classifier.ts`).
- [x] Utilize and adapt Phase 0 `hydrator.ts` test structures to resolve data directly using rigorous type validation bounds (Zod CMS matching).

## Verification & Tests

**Test Integrations:** Mocks currently run via `tests/tracer/03_hydrator.test.ts` and `tests/llm/llm_classification.test.ts`.

---

## 🚀 Improvements & Next Steps

1. **Hydrator Mock Paths Abstraction:** The Phase 0 `hydrator.ts` prototype currently utilizes hardcoded strings (e.g., `./mock_capture/01_raw_dom.html`). This must be decoupled via function arguments to dynamically receive whatever `nodeMap.json` payload the crawler explicitly dumped per pipeline execution.
2. **Automated Batch Test Pipeline:** Though `batch_classifier.ts` accurately loops Phase 2 folders, it lacks a Vitest automated mock assertion ensuring it correctly merges classification objects into the `04_manifest.json` interface block layout.
3. **Graceful Fallbacks:** If the `batch_classifier.ts` yields a `blockType: "Unknown"` inference resolution, the Hydrator should be wired to safely encapsulate the raw HTML blob in a fallback component to ensure zero data loss across unsupported legacy patterns.
