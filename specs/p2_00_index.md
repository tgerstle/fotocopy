# Phase 2: Structural Intersection & Templates (Overview)

## Objective

Before sending chunks to the LLM (Phase 4), we must remove heavy, redundant global elements (Headers, Footers, Sidebars) to save tokens and prevent the LLM from classifying the same navigation menu 500 times. We also need to map URL structures to CMS Collections.

## Core Concepts (To be drilled down)

### 1. The Global Hashing Engine

The orchestrator needs to mathematically prove what a "Header" is across a legacy site without relying on semantic tags (since legacy sites often use `<div>` soups).

- **Process:** Generate a structural hash of nodes based on their class names, child topology, and depth.
- **Intersection:** If a hash appears identically on >90% of the crawled URLs, it is mathematically proven to be a global region.
- **Action:** These node hashes are added to `globals_manifest.json` so the Chunk Slicer (Phase 1) knows to ignore them.

### 2. Collection & Template Inference

Instead of treating all pages as "Ad-Hoc" blocks, we group them into structured CMS Collections (like `Posts` or `Products`).

- **Process:** Analyze URL topologies (e.g., `/articles/*`).
- **Process:** Compare the structural hashes of the inner content. If 50 pages share the same URL string root and have the exact same box-model topology, they get flagged as a `Collection`.

## Core Specs

1. **[Chunk Slicing](./p2_01_chunk_slicing.md)** - Algorithm rules dividing flat HTML trees into geometric chunks (handling Boxed layouts & color shifts) after global intersections are removed.
2. **[Global Intersection (Hashing Engine)](./p2_02_global_intersection.md)** - Mathematically proving headers and footers across the site.
3. **[Collection & Template Inference](./p2_03_template_inference.md)** - Clustering URLs based on route and geometric similarities.
4. **[Orchestrator Integration](./p2_04_orchestrator_integration.md)** - Wire the hash engine outputs into the slicer and inference functions to physically purge the global node arrays.
