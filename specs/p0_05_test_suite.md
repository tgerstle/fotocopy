# Phase 0: Test Suite & Iteration Loop

The power of the Tracer Bullet is that it provides a fast, localized feedback loop. Because we are mocking the heavy lifting (Playwright scraping and Ollama inference), the entire Phase 0 pipeline should execute and validate in milliseconds.

This enables a strict Test-Driven Development (TDD) loop. If we need to change our data schema (e.g. adding `buttons` to a `Hero` block), we MUST update the mock files here, ensure the test suite passes, and ensure the UI renders correctly _before_ touching the actual Python/Node scraping logic.

## The testing pipeline (`npm run test:tracer`)

We will use **Vitest** for our test suite due to its speed and native TypeScript support. A single command will cascade through the mock pipeline.

### Step 1: Validate Design Tokens

**File:** `tests/tracer/01_tokens.test.ts`

- **Action:** Reads the static file `mock_capture/01_design_tokens.json`.
- **Assertion:** Validates the structure against the strict W3C DTCG Zod Schema (ensuring `$value` and `$type` exist).
- **Why:** Proves that the Phase 1 crawler natively outputs standard W3C definitions without structural defects.

### Step 2: Validate the LLM Pointers (Zod)

**File:** `tests/tracer/02_llm_schema.test.ts`

- **Action:** Reads the static file `mock_llm/02_llm_output.json`.
- **Assertion:** Parses it against the strict Zod schema (`LLMPageSchema`).
- **Why:** This enforces the golden rule: The LLM output MUST contain only IDs (pointers) and block definitions. If you mock the LLM outputting real text (`"mapping": { "heading": "Welcome" }`) instead of IDs (`"mapping": { "headingNodeId": "102" }`), this test will immediately fail.

### Step 3: Validate the Hydrator (Zero Hallucination Proof)

**File:** `tests/tracer/03_hydrator.test.ts`

- **Action:** Executes the `hydrator.js` engine against the mock LLM output and the `01_raw_dom.html` snippet.
- **Assertions:**
  1.  **Extraction Accuracy:** The outputted `03_cms_ready.json` contains the literal string `"Welcome to Fotocopy"` for the `Hero` title.
  2.  **Graceful Fallback:** If the LLM generates a mapping for an ID that does _not_ exist in the HTML (simulating an hallucination), the Hydrator logs a warning and returns `null` or empty text, rather than crashing the thread.
- **Why:** This computationally guarantees that the LLM cannot invent data. The final output is strictly a string extracted from the original DOM.

### Step 4: Validate Next.js React Hydration

**File:** `tests/tracer/04_frontend.test.tsx`

- **Action:** Mounts `<BlockRenderer blocks={layout} />` in a simulated DOM testing environment (using `@testing-library/react`), feeding it the newly generated `03_cms_ready.json`.
- **Assertions:**
  1.  The specific React components (e.g., `<Hero>`) are dynamically mounted.
  2.  The text `"Welcome to Fotocopy"` exists in the rendered HTML.
  3.  **Strict Styling:** The resulting rendered HTML contains the Tailwind classes generated in Step 1 (e.g., `className="text-primary"`).
- **Why:** Proves the final CMS output seamlessly hydrates the frontend.

### Step 5: Validate Error Boundaries & DLQ

**File:** `tests/tracer/05_resilience.test.ts`

- **Action:** Passes severely corrupted LLM mock data (e.g., missing node IDs, completely hallucinated keys) into the `hydrator.js` script.
- **Assertions:**
  1. The Hydrator **does not throw a fatal Node Exception** or crash the test suite.
  2. The script returns an error object, catching the fault internally.
  3. A log is appended to a mock `.fotocopy/dlq.json` (Dead Letter Queue) capturing the failed context.
- **Why:** Ensures that if page 499 fails on a production crawl, the system gracefully logs it and proceeds to page 500.

## The Iteration Loop

Whenever the schema needs upgrading, we follow this exact loop:

1. **Modify the Source:** Update `01_raw_dom.html` (add an `<a href>` string) or `01_design_tokens.json`.
2. **Modify the LLM Mock:** Update `02_llm_output.json` to include the specific `linkNodeId`.
3. **Update the Zod Schema:** Ensure `LLMBlockSchema` allows `linkNodeId`.
4. **Update the React Component:** Modify `Hero.tsx` so it renders an `<a>` tag expecting the new data shape.
5. **Run the Suite:** `npm run test:tracer`. If all tests pass, the pipeline is proven, and we can hand the updated components and schemas over to the actual Crawler engineering team.
