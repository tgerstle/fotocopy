# Phase 2, Step 4: Orchestrator Integration (The Purge & Sync)

While the individual algorithms for Phase 2 (Chunk Slicing, Global Intersection, and Template Inference) work effectively in isolation, they must be wired together into a cohesive offline pipeline.

## 1. The Purge Workflow

Currently, the `hash_engine.ts` mathematically identifies global footprints (like Headers and Footers) and exports them, but the runtime does not yet act on them.

**Integration Goal:**

- Create an integration script (`orchestrator.ts`).
- Execute the `hash_engine` to produce a `globals_manifest.json` containing the footprint arrays of >90% identical structures.
- Traverse the captured `nodeMap.json` (Phase 1) and **physically delete** any nodes matching those global hashes.
- Pass this cleansed node array securely into `chunk_slicer.ts`.

## 2. Template Inference Hash Sync

The Template Inference logic currently simulates the subtraction of global elements by executing a hard-coded semantic strip: `$("nav, header, footer").remove()`. This violates the mathematical, tag-agnostic footprint philosophy we established in step 2.

**Integration Goal:**

- Refactor `template_inference.ts` to accept the dynamically generated `globalHashes` array outputted from Step 2.
- Have Cheerio traverse the loaded DOMs, generate structural signatures natively on the fly, and strip any branch whose signature matches the `globalHashes` array.
- This guarantees "Div-soup" headers are identically purged in the inference logic as they are in the chunking logic.

## Implementation Status

- [x] Create `scripts/intersection/orchestrator.ts` to wire inputs and outputs together.
- [x] Implement physical deletion of `nodeMap.json` nodes based on `globalHashes`.
- [x] Refactor `template_inference.ts` to accept and utilize actual hash arrays instead of hardcoded semantic tag removal.

## Verification & Tests

- [x] **E2E Integration Pass:** Add a Vitest suite feeding mathematical mocks through the Orchestrator, proving that global nodes are automatically omitted from both the generated sequential chunks and the clustering inference logic.
