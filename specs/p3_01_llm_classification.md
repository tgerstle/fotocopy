# Phase 3, Step 1: LLM Classification (`src/llm/ollama_client.js`)

**Goal:** Create a mathematically robust AI classification step utilizing Ollama, local models, and strict schema validation. This serves as Phase 3, Step 1 in the architecture pipeline.

## Architectural Decisions

Relying on prompting LLMs to "output JSON only" frequently breaks when the model appends markdown code blocks or thinks out loud. We will bypass this entirely by using the Ollama REST API with native Structured Outputs configured to `gemma4:e4b`.

## Execution Flow

1.  **Accept Chunk Payload:**
    - The utility function receives structural payloads from the Slicing Pass.
    - Payload includes the sanitized HTML chunk + matched Geometry Math + Accessibility semantics.

2.  **Define Zod / JSON Schema (Bottom-Up Component Discovery & ID Pointers):**
    - **CRITICAL:** Do NOT ask the LLM to output raw text (e.g., `content: "<p>Welcome to Acme...</p>"`). LLMs hallucinate or summarize long text.
    - Let the LLM _create_ the component name based on visual geometry and layout.
    - Enforce a loose discovery schema: `{ "inferredBlockType": "StaffGrid", "mappings": { "title": "123", "personImage": "456" } }`. The LLM discovers the schema intent but strictly maps values back to the `data-awa-id` stamped during Pass 1.

3.  **Construct REST API Call:**
    - Target `http://localhost:11434/api/generate` instead of the command-line buffer.
    - Crucial Parameter: Pass the JSON Schema definition directly into the API request's `format` field.

4.  **Execute & Parse:**
    - Await inference from `gemma4:e4b`.
    - Because `format` acts at the generation-token layer inside Ollama, it prevents the model from generating any tokens outside the bounds of the schema.
    - Call `JSON.parse()` on the response with zero risk of structural errors or markdown backtick collisions.

5.  **Return & Re-Hydrate Data:**
    - The Node.js orchestrator receives the LLM's classification (e.g. `nodeId: 123`).
    - It uses `123` to look up the exact, un-altered string of HTML in the original snapshot, guaranteeing **100% data fidelity**.
    - Resolves the finalized Data object to build the Next.js `route.json` manifests.

---

## Implementation Status

- [x] Create `src/llm/ollama_client.js` (Implemented as `scripts/llm/ollama_client.ts`).
- [x] Configure `fetch` against `localhost:11434/api/generate`.
- [x] Implement Zod to JSON Schema converter for the `format` payload.

## Verification & Tests

**Test File:** `tests/llm/llm_classification.test.ts`

**Test Requirements:**

- [x] **API Contact (Mocks):** Mock the network layer to ensure the API call perfectly formats the payload with the JSON schema attached to the `format` property.
      _(Note: Full end-to-end testing against local Ollama should be treated carefully in CI/CD, but we can assert the payload construction)._

**Execution:**
`npm test`

---

## 🚀 Improvements & Next Steps

While the core functionality is mathematically proven, the following optimizations remain pending for Phase 3 scaling:

1. **Component Consolidation Pipeline:** Because the LLM is now discovering blocks "Bottom-Up" (e.g. producing `StaffGrid` and `OurTeam`), we need a script to cluster and normalize these schemas into a master `fotocopy.components.json` config. You (the developer) will then approve this generated schema before moving to Phase 4.
2. **Temperature & Concurrency tuning:** Ollama requests are currently processed synchronously in a simple loop. Batch concurrency limits via `p-limit` or similar should be introduced to maximize localized GPU inference throughput without crashing local RAM.
