# Phase 7.1: Global Component Scaffolding

## Overview

During Phase 2 (`p2_02_global_intersection.md`), the `hash_engine` identifies repeating layout geometries across multiple URLs (such as Site Headers, Footers, and Sitewide Navigation). Those hash references are deposited into `globals_manifest.json` and cleanly purged from the standard chunk pipeline to prevent the LLM from redundantly analyzing the `<header>` block 100 times.

This sub-phase handles the targeted inference and scaffolding of those **Global** elements explicitly.

## Workflow

### 1. Hash Manifest Indexing

Right before Phase 4 completes, a parallel runner subsystem will ingest the root array of `globals_manifest.json`:

```json
{
  "globalHashes": ["80ac05650e848e1cd0405...", "4bd081edb471b0eaf549d..."]
}
```

### 2. Single-Instance Lookup

Rather than scanning directories of chunks, the orchestrator iterates over the `globalHashes` array, locates the _first occurrence_ of that hash mapped to any physical DOM output in the `live_capture` directory, and extracts exactly ONE chunked representation.

### 3. Global Inference Pass

The orchestrator executes the selected blocks against `classifyChunk()` (Phase 3 LLM logic). The prompt instructs the LLM to categorize these structures not as traditional variant blocks (e.g., "Hero" or "Grid") but as Singleton Shell blocks (e.g., "SiteHeader", "AppFooter", "SideNav").

### 4. Generation Constraints (Global vs. Local)

When `prompt_generator.ts` intercepts a "Singleton Shell Block", it alters the generation context for GitHub Copilot slightly:

1. **Layout Wrapper:** Global components wrap `children`. It must render Next.js Layout standards properly instead of acting like a Payload CMS flexible block array.
2. **Strict Tailwind Variables:** Prompts enforce CSS Variable binding (e.g. `bg-[var(--color-primary)]` rather than hardcoded hex maps (`bg-[#000]`)) using the W3C tokens passed in, guaranteeing the global wrapper responds natively to the Payload CMS global settings UI later.

## Expected Outcomes

- `output/components/globals/SiteHeader.tsx`
- `output/components/globals/AppFooter.tsx`

This safely decouples the page-builder payload from the layout shell frame smoothly.
