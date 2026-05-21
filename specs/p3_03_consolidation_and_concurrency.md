# Phase 3, Step 3: Component Consolidation & Concurrency Scaling

**Goal:** Establish stability guarantees regarding memory allocation for offline GPU inference and introduce a schema consolidation pipeline to group organically discovered legacy component architectures into a master manifest.

## 1. Concurrency Limiting (Ollama Bottleneck Prevention)

### The Problem
During batch classification, passing 50+ layout chunk chunks concurrently to a local LLM via \`Promise.all()\` will exhaust GPU VRAM, OOM crash Ollama, or cause severe thermal throttling.

### The Solution: \`p-limit\`
- **Tool:** \`p-limit\` library (or native chunked iteration).
- **Implementation:** Wrap the asynchronous mappings in \`scripts/llm/batch_classifier.ts\` inside a bounded execution pool.
- **Configuration Driven:** Introduce an \`ollamaLimit\` or \`maxConcurrency\` property within the global configuration schema (mapped in \`fotocopy.config.ts\`). Default to \`2\` or \`4\` concurrent inferences, adjustable depending on the host's Apple Silicon unified memory / GPU power.

## 2. Component Consolidation Pipeline

### The Problem
Because our Phase 3 architecture embraces "Bottom-Up Component Discovery," the local model will invent a vast, organic taxonomy across a site's footprint (e.g., yielding \`HeroImage\`, \`HeroBanner\`, \`HeroLayout\`, \`StaffGrid\`, \`OurTeam\`). If we pass 50 overlapping synonyms into Phase 4 (Scaffolding), the system will build 50 separate React components when it should only build ~15.

### The Solution: Consolidator Script
Create a distinct bridge utility: \`scripts/llm/consolidator.ts\`.

**Execution Flow:**
1. **Aggregation:** The script scans all fully hydrated JSON layout outputs in the \`output/\` directory, extracting every unqiue \`inferredBlockType\` plus their exact mapped data structural keys.
2. **Clustering & Synonym Merging:** Group elements utilizing identical or highly similar structural shapes. This can be accomplished mathematically (by comparing key intersection arrays) or by dispatching one final "clustering prompt" back to the LLM (e.g., *"Group these 50 discovered component synonyms into 15 canonical component structures"*).
3. **The Final Artifact (Developer Source of Truth):**
   - Output a master \`fotocopy.components.json\` dictionary.
   - Example shape:
     \`\`\`json
     {
       "Hero": {
         "matches": ["HeroBanner", "HeroImage"],
         "schema": { "title": "string", "image": "string" }
       },
       "StaffGrid": {
         "matches": ["OurTeam", "StaffGrid"],
         "schema": { "teamMembers": "array" }
       }
     }
     \`\`\`
4. **Human Verification:** Phase 3 operations halt here. A developer inspects, modifies, or signs off on \`fotocopy.components.json\` before the automated Phase 4 (React/Copilot Generation) touches the data.

## Verification & Tests
- Ensure \`p-limit\` caps execution correctly in \`vitest\` logs (measured via timestamp delays, preventing parallel burst requests).
- Write a test mocking several duplicated Phase 3 \`output\` dumps to ensure \`consolidator.ts\` successfully deduplicates shape variations.
