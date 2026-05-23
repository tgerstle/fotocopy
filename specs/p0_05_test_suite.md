# Phase 0: Test Suite & Iteration Loop (Mock-First TDD)

Because Fotocopy operates as a complex compiler pipeline where outputs of Phase 1 feed Phase 2, end-to-end testing becomes extremely slow when relying on live web scraping or live LLM inference.

We utilize a strict **Mock-First Test-Driven Development (TDD)** loop using **Contract-Driven Testing**. Before integrating any phase into the CLI Orchestrator (`pipeline_runner.ts`), we will build isolated tests for each stage. Each stage must mathematically prove it transforms a static mock input into the exact expected mock output.

## The Testing Pipeline (`npm run test:tracer`)

We use **Vitest** for our test suite. The pipeline cascades through isolated stage-checks perfectly matching our architecture.

### ✅ Stage 1: Validate Semantic Token Extraction (Phase 2.3)

**File:** `tests/tracer/01_token_extractor.test.ts`

- **Mock Input:** A raw JSON payload `mock_computed_styles.json` containing wild styling (e.g. `17px` padding, `#ff0000`, `rgb(20, 20, 20)`).
- **Action:** Executes the `token_extractor.ts` quantization engine.
- **Mock Output Assertion:**
  1. Hex codes are parsed into raw rgb spacing natively for Tailwind.
  2. Spacing is strictly snapped to multipliers of 4 (e.g., `17px` becomes `16px`).
  3. Output correctly maps to the Shadcn Semantic ontology (`--primary`, `--background`).
- **Why:** Proves we sanitize wild web designs into strict strict Tailwind schemas without LLM invention.

### ✅ Stage 2: Validate the Semantic ID Hydrator (Phase 3.2)

**File:** `tests/tracer/02_hydrator.test.ts`

- **Mock Input:** `mock_llm_output.json` containing abstract pointer IDs (e.g., `"headingNodeId": "102"`) and `mock_raw_dom.html`.
- **Action:** Executes the `hydrator.js` engine.
- **Mock Output Assertion:**
  1. The output `cms_ready.json` contains the literal string matching ID `102`.
  2. If the LLM invents an ID that doesn't exist, the Hydrator handles it gracefully without a fatal crash.
- **Why:** This guarantees our Zero-Hallucination policy. The LLM handles layout concepts, but the node parser guarantees text fidelity.

### ✅ Stage 3: Validate the DAG Component Scaffolding (Phase 4.2)

**File:** `tests/tracer/03_dag_orchestrator.test.ts`

- **Mock Input:** A unified JSON semantic blueprint defining a `<Footer>` with links and a newsletter.
- **Action:** Executes the `prompt_generator.ts` logic with a mocked LLM caller.
- **Mock Output Assertion:**
  1. The engine yields exactly 3 separate `Map` calls for micro-primitives (`SocialLink`, `NewsletterForm`, `FooterLayout`) rather than a single monolithic prompt.
  2. The system prompt dynamically includes the literal `--primary` semantic token dictionary generated in Stage 1.
- **Why:** Ensures we break tasks down to heavily lower cognitive strain on local LLMs.

### ✅ Stage 4: Validate the AST Self-Healing Guard (Phase 4.2.b)

**File:** `tests/tracer/04_ast_guard.test.ts`

- **Mock Input:** A string containing deliberately broken React code: `export const Footer = () => <div>Hello</rabutton>`
- **Action:** Run the string through the `AST Parser Guard`.
- **Mock Output Assertion:**
  1. The Parser natively throws an error intercept.
  2. It immediately launches the "Reflection Loop" passing the context trace to the mocked LLM layer to heal the bracket.
  3. Retries respect the strict `max_retries: 2` cap.
- **Why:** Proves that broken LLM syntax will never crash the sandbox environment, catching JSX hallucination entirely in-memory.

### ✅ Stage 5: Validate the Template Sandbox Copy (Phase 4.4)

**File:** `tests/tracer/05_template_delivery.test.ts`

- **Mock Input:** A fake `dummy_sandbox` folder and an `output_dir`.
- **Action:** Executes the pipeline filesystem extraction phase.
- **Mock Output Assertion:** The sandbox is fully cloned into the correct dynamic directory, stripped of `node_modules`. Components written in previous steps drop correctly into `src/components/globals`.
- **Why:** Ensures absolute 100% decoupling from the core monorepo context.

## The Iteration Loop

Whenever the system capability needs upgrading, we follow this loop:

1. **Update the Mock Source:** Add edge cases (e.g. `rgba(255,255,255,0.5)` logic) to `mock_computed_styles.json`.
2. **Run the Suite:** `npm run test:tracer`. Watch the Token Extractor test fail.
3. **Patch the Script:** Fix the `token_extractor.ts` regex.
4. **Pass & Integrate:** Once all stages pass isolated I/O tests, integrate the updated script back into `pipeline_runner.ts` for full End-to-End Orchestrator testing.
