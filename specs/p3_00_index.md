# Phase 3: AI-Driven Classification & Data Structuring (Overview)

## Objective

This phase represents the core intelligence of the migration engine. It takes the sliced, noise-free DOM chunks from Phase 2 and uses a local LLM to classify the UI components into strict JSON pointers, which are then hydrated into the final CMS-ready data structure.

## Core Specs

1. **[LLM Classification](./p3_01_llm_classification.md)** - Offline inference utilizing `gemma4:e4b` REST integration to yield strict Zod JSON payloads consisting exclusively of node pointer IDs.
2. **[Hydration Engine](./p3_02_hydration_engine.md)** - Production script that reads pointer IDs, references the original offline DOM, and extracts the literal strings/attributes to guarantee zero AI hallucination. (See Phase 0 Hydrator `p0_03_hydrator.md` for foundational concepts).
3. **[Component Consolidation & Concurrency Scaling](./p3_03_consolidation_and_concurrency.md)** - Dedicated pipeline to cluster organically discovered components into a unified `fotocopy.components.json` manifest, and implementation of `p-limit` restrictions safely saturating local GPU inference loads.
