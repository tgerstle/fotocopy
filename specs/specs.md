# Project Specs: Migration Engine Breakdown

This document translates the high-level project outline into concrete, actionable technical specifications, structured by phase. For each step, we define the **Problem (Need)** and the **Technical Implementation (How)**, leveraging available tools and libraries.

---

## 🛠️ Phase 1: Orchestration Foundation & Discovery (Completed)

**Objective:** Establish the initial data pipeline, moving from an unconstrained crawl to structured, component-aware data capture.

### **1.1. Adaptive Web Auditing (Crawling Engine)**

- **Need:** Must reliably crawl complex, modern websites while bypassing client-side anti-scraping measures (e.g., interstitials, cookie banners, interactive modals).
- **Technical Implementation (How):**
  - **Tool:** Utilize the existing `site-scanner` infrastructure.
  - **Detail:** Focus on maximizing Playwright's capabilities within the **Scenario System**. Must build specialized user workflows that execute JavaScript to accept cookies, click necessary "Accept" buttons, and wait for specific visible selectors to resolve before attempting content extraction.
  - **Deliverable:** A robust Playwright script template that incorporates wait-for-selector logic and event-based flow control.

### **1.2. Visual & Structural Capture**

- **Need:** Raw text is insufficient. We need to understand the _layout_ and _spatial relationship_ of content elements (the "box model").
- **Technical Implementation (How):**
  - **Tool:** Enhance Playwright integration.
  - **Detail:** Modify page interaction scripts to execute JavaScript hooks at critical points (e.g., after loading main content). The script must use `elementHandle.evaluate()` to capture:
    1.  `getBoundingClientRect()` for all major parent containers.
    2.  `window.getComputedStyle()` to capture computed layout properties (padding, margin, displayed dimensions).
  - **Deliverable:** A structured data payload (JSON) attached to the HTML crawl output, containing coordinates and calculated styles for major elements.

### **1.3. Local AI Deployment for Intent**

- **Need:** Initial classification of scraped content intent without incurring high, real-time API costs.
- **Technical Implementation (How):**
  - **Tool:** Ollama running a locally hosted Gemma 2 model.
  - **Detail:** Develop a pre-processing function that feeds the _scraped structure_ (HTML + Bounding Box data, not just raw HTML) to the LLM. The prompt must be highly constrained to force classification into predefined buckets.
  - **Deliverable:** A local utility wrapper around the Ollama CLI that accepts a structure chunk and returns a standardized intent tag (e.g., `INTENT:HERO`, `INTENT:TEXT_BLOCK`).

---

## 🧩 Phase 2: Structural Intersection & Content Stripping (Completed)

**Objective:** Filter the noise, isolate the unique, meaningful content, and standardize the design system vocabulary. We rely on mathematically offline tag-agnostic parsing rather than raw HTML scraping.

### **2.1. Global Region Slicing (Deduplication) - Completed**

- **Need:** To prevent the content database from being polluted by identical headers, footers, or navigation bars that appear on 90%+ of pages.
- **Technical Implementation (How):**
  - **Tool:** A structural hashing function implemented in Node.js (`hash_engine.ts`).
  - **Detail:**
    1.  Capture the _DOM Tree_ stripped of inner textual content and unstable IDs for all captured pages.
    2.  Generate a **structural SHA-256 hash** for key subtrees.
    3.  Iterate through all hashes. If a hash appears $> 90\%$ of the time, the orchestrator (`orchestrator.ts`) physically purges the nodes matching this signature utilizing `data-awa-id` bindings. This prevents the global div-soup from entering the primary payload arrays.
  - **Deliverable:** A cleansed array of nodes strictly representing inner unique page content (stripped of layout globals), outputted as a consolidated matrix for the next algorithm.

### **2.1.b. Template Inference & Collection Extraction - Completed**

- **Need:** Group architecturally identical URLs into strict content "Collections" to bypass unstructured classification delays.
- **Technical Implementation (How):**
  - **Tool:** `template_inference.ts` and Cheerio mapping logic.
  - **Detail:** Group common URLs (e.g. `/news/*`). Apply the same identical Global Hash array to prune navigation menus. Compare the resultant cleaned layout hashes. If the pruned trees mathematically equate to identical hashes, infer these pages belong to identical collections and output as Template Objects mapping URLs.
  - **Deliverable:** Collection maps defining dynamic paths natively mapped to uniform Collection topologies.

### **2.2. The Sibling Boundary Rule (Component Isolation) - Completed**

- **Need:** To break the remaining flat, monolithic HTML structure into discrete, self-contained, and sequential "layout chunks" (e.g., Hero, Body Features, CTA) without breaking inner elements.
- **Technical Implementation (How):**
  - **Tool:** Parent-aware layout chunking logic (`chunk_slicer.ts`).
  - **Detail:** Analyze the purged dataset. We bypass naive 100% viewport restrictions to support "boxed" layouts. We iterate sibling nodes and slice boundaries whenever:
    1.  A child element spans $\ge$ 95% of its immediate visual parent's width constraint.
    2.  A significant visual margin gulf exists `margin-top`.
    3.  The element modifies background visual layout colors significantly compared to the prior block.
    4.  Semantic section delineators appear (`<section>`, `<hr>`).
        _Note: Elements strictly possessing sticky or absolute positional floats bypass boundaries completely to ensure sticky navigations/widgets don't erroneously split flow logic._
  - **Deliverable:** An ordered array of discrete "Chunk" block objects (e.g. `[Chunk 1, Chunk 2]`) representing physical vertical components cleanly passed onto the LLM classifier phase.

### **2.3. Design Token Extraction (Semantic Mapping)**

- **Need:** To convert inconsistent codebase styles into a standardized, utility-first system. The system must rely on standard Tailwind baseline scales (spacing, typography) while clustering wild colors into a strict predefined **Semantic Token Schema** compatible with `shadcn/ui`.
- **Technical Implementation (How):**
  - **Tool:** A CSS frequency and semantic mapping script (`token_extractor.ts`) analyzing the captured `getComputedStyle()` payloads.
  - **Detail:**
    1.  **Baseline Tailwind Sizing:** Standardize routine geometric anomalies (padding, margins, font sizes) to the closest built-in Tailwind baseline scale (e.g., `17px` snaps to standard Tailwind `16px` -> `p-4` or `text-base`), preventing token bloat.
    2.  **Color Space Conversion:** Parse all color strings into bare `r g b` or `h s l` space values to fully support Tailwind v4 opacity modifiers (e.g. `bg-primary/50`).
    3.  **Semantic Quantization (The Mapping):** Run clustering to determine hierarchy, then map the discovered color palette and typography rules to a strict predefined global semantic list:
        - `--background` / `--primary` / `--muted` / `--border` etc.
        - `--font-sans` / `--font-heading`
        - `--container-padding` / `--section-spacing` / `--radius`
    4.  **Output:** Map these to CSS variables scoped to the `:root` selector in a `globals.css` file matching standard the `shadcn/ui` architecture.
  - **Testing Strategy:**
    - Create a mock `getComputedStyle()` JSON dataset with 10 variations of blue, whites, grays, and weird paddings.
    - Run the extractor and verify using Jest/Vitest that the script correctly maps the dominant light colors to `--background`, the dominant blue to `--primary`, and snaps random `15px` padding to the Tailwind `16px` baseline.
  - **Deliverable:** A `globals.css` stylesheet injected directly into the user template sandbox, alongside a Semantic Token dictionary passed into the LLM Generation.

---

## 🧠 Phase 3: AI-Driven Classification & Mapping (Completed)

**Objective:** Transform the structured, clean layout blocks from Phase 2 into machine-readable, architecturally sound JSON blueprints using Bottom-Up Component Discovery and strict data hydration boundaries.

### **3.1. Bottom-Up Intent Classification (Organic Discovery)**

- **Need:** Legacy sites consist of unknown elements. Hardcoding a limited vocabulary block array (e.g., `Hero`, `FAQ`) creates data loss or system panic when unmapped content is confronted.
- **Technical Implementation (How):**
  - **Tool:** Local LLM (Gemma via Ollama REST) natively constrained by **Zod to JSON Schema (`zod-to-json-schema`)**.
  - **Detail:** The API instructs the LLM to act as a "Layout Architect." The inference schema receives `inferredBlockType: z.string()`, empowering the local model to securely classify structural data using generated nomenclatures (e.g., `StaffGrid`, `EventList`).
  - **Deliverable:** Highly validated JSON block schemas that accurately model chaotic legacy architectures.

### **3.2. The Semantic Identity Pointer (ID Hydration Scale)**

- **Need:** LLMs hallucinate text, rewrite copy, or drop nodes when translating long markup snippets.
- **Technical Implementation (How):**
  - **Tool:** A specialized LLM prompting architecture enforcing pure pointer math coupled with a downstream Cheerio Node `hydrator.ts` script.
  - **Detail:** Instead of asking the AI for text, the models only yield physical mappings bound to `data-awa-id` attributes established in Phase 1 (e.g., `{ "title": "id-543", "url": "id-981" }`). The `hydrator.ts` reads the LLM map and identically lifts raw source HTML objects out of `nodeMap.json`.
  - **Deliverable:** Mathematical absolute data fidelity preserving exact legacy copy and semantics without AI rewrites.

### **3.3. JSON Blueprint Finalization**

- **Need:** To formulate a robust physical JSON artifact representing each individual migrated layout snippet organically.
- **Technical Implementation (How):**
  - **Tool:** Batch classifiers bridging Phase 2 chunk objects to perfectly hydrated Phase 3 mapped layouts.
  - **Detail:** The outputs represent purely generated schemas matching reality. (Pending Optimization): Introduce a "Component Consolidation Pipeline" aggregating all locally invented blocks (`OurTeam`, `StaffGrid`) into a standardized configuration `fotocopy.components.json`.
  - **Deliverable:** Immutable JSON blueprints for routing Phase 4 rendering targets.

---

## 💻 Phase 4: Local Synthesis & Verification (Completed)

**Objective:** Test the generated blocks natively in a local environment prior to touching production infrastructure.

### **4.1. JSON Route Manifest Generation**

- **Need:** A single source of truth mapping every migrated URL to its structured content blueprint.
- **Technical Implementation (How):**
  - **Tool:** A simple build script that aggregates the final JSON blueprints from all processed pages.
  - **Detail:** For every unique URL processed, generate a companion JSON file representing the structured content. This file's primary payload _is_ the structured data blueprint for the components on that page.
  - **Deliverable:** A directory structure `/manifests/` containing the structured JSON configurations.

### **4.2. Component Prompt & Auto-Scaffolding Generation**

- **Need:** Transform the structured LLM block definitions from Phase 3 into physical React `.tsx` code without risking LLM HTML hallucination. We also need to avoid generating monolithic component blocks that exceed local LLM complexity capacities and introduce hallucinated tags.
- **Technical Implementation (How):**
  - **Tool:** Prompt Generator, DAG orchestration logic, & isolated `shadcn/ui` workspace library.
  - **Detail:**
    1.  **Component DAG (Directed Acyclic Graph):** Instead of prompting the LLM for a massive full-page component (e.g., `Footer.tsx`), the pipeline orchestrates bottom-up composition in a two-stage DAG:
        - _Map Stage:_ The engine asks the model to output sub-primitive files required for the component layout (e.g., `SocialLink.tsx`, `NewsletterForm.tsx`).
        - _Reduce Stage:_ Provide the interface definitions from the Map Stage back to the LLM to write the orchestrator parent `FooterLayout.tsx`.
    2.  **Reference Grounding:** Construct strict prompts mandating the usage of pre-installed `shadcn/ui` components (e.g. `@/components/ui/button`).
    3.  **Semantic Token Dictionary Enforcement:** Pass the exact semantic global tokens determined in Phase 2.3 directly to the LLM. Instruct it to mathematically rely on baseline Tailwind classes for spacing/typography (e.g., `p-4`, `text-lg`), and restrict colors ONLY to the semantic palette (e.g., `bg-primary`, `text-muted-foreground`, `border-border`). Prevent it from inventing arbitrary values like `bg-[#0a0a0a]`.
  - **Testing Strategy:**
    - Isolate the scaffolding prompt function and pass it a mocked complex `Footer` JSON blueprint.
    - Assert that the function correctly spawns N micro-primitive generation promises rather than a single monolithic call. Validate the system prompt correctly injects the semantic `shadcn/ui` color maps and enforces baseline tailwind constraints.
  - **Deliverable:** Highly modularized `.tsx` files utilizing strictly constrained `shadcn/ui` layout structures and native standard Tailwind primitives.

### **4.2.b. Self-Healing Syntactic Guards**

- **Need:** Generation artifacts frequently suffer from truncation or hallucination at the tail end of generative loops (e.g., mismatched JSX tags like `<rabutton>`, missing closing brackets).
- **Technical Implementation (How):**
  - **Tool:** AST Parser wrapper (TypeScript Compiler API or SWC parser) intercepting code strings before disk write.
  - **Detail:** Prior to saving the LLM output to disk, the pipeline runs the raw code string through `ts.createSourceFile()` or an equivalent swift parser.
    - If `syntaxDiagnostics` are flagged (e.g., "Expected corresponding JSX closing tag"), the script catches the exception.
    - It triggers a **Reflection Loop**: The LLM is sent the exact parsing error stack trace alongside its broken code block with the instruction to repair the syntax.
    - Reflection retries are constrained by a hard limit (`max_retries: 2`) before emitting an error boundary fallback component.
  - **Testing Strategy:**
    - Construct a unit test (`syntactic_guard.test.ts`) that feeds the guard a string with a deliberate typo: `<h1>Hello</h1></section>`.
    - Mock the LLM endpoint to return fixed code `<h1>Hello</h1>` only when it receives the correct error trace prompt. Assert the guard intercepts, retries, and yields the repaired string.
  - **Deliverable:** Guarantee that any component saved to disk will compile successfully in Vite/Storybook locally without breaking the React AST tree.

### **4.3. Visual QA Loop (Storybook Pivot)**

- **Need:** To visually validate that the component scaffolding actually renders correctly, perfectly isolated from application routing layout logic.
- **Technical Implementation (How):**
  - **Tool:** Storybook (`npm run storybook`) & Tailwind CSS integration.
  - **Detail:** The autoscaffolding prompt instructs the LLM to output the React component (`[Component].tsx`) and a valid Storybook `.stories.tsx` file using mock data. Crucially, Storybook is configured to ingest the dynamically generated `globals.css` containing the legacy design tokens so all underlying `shadcn/ui` components instantly paint with correct brand styling automatically.

### **4.4. The Portable Compiler Target (Template Handoff)**

- **Need:** Pre-computing a multi-tenant testbed creates code overlap where Client A components conflict with Client B. Migrations must output as fully decoupled, portable artifacts.
- **Technical Implementation (How):**
  - **Tool:** Recursive file copying utility within the pipeline.
  - **Detail:** Rather than emitting components into the core monorepo (`packages/sandbox`), the pipeline shifts to a final Phase 4 state. It clones a hidden `/packages/core/templates/react-sandbox` Vite/Storybook template into the user's defined `--output-dir`. LLM components natively drop directly into this newly minted directory.
  - **Deliverable:** A completely independent React directory representing the exact client deployment, capable of running `npm i && npm run storybook` externally without needing Fotocopy logic attached.

---

## 🚀 Phase 5: Site-Wide Orchestration & State Management (Completed)

- **Need:** Scale the pipeline from a single URL to thousands safely without OOM errors, and support restartable queues if failure occurs.
- **Technical Implementation (How):**
  - **Tool:** Local SQLite Database (`better-sqlite3`) inside the user's output directory.
  - **Detail:** Implement a Dry-Run Spider to rapidly fetch structural headers and map taxonomy before heavy LLM logic kicks in. The DB tracks records through states (`DISCOVERED`, `CRAWLED`, `HASHED`, etc.) using atomic batched updates and concurrent queue consumption to manage process backpressure.
  - **Deliverable:** Fully resilient `pipeline_runner.ts` orchestrator capable of pausing, resuming, and healing hanging background execution slots safely.

## 🚀 Phase 6: Structural Clustering & At-Scale Extraction (Completed)

- **Need:** Process massive identical site templates without wasting GPU/LLM classification cycles on repeatedly scanning the exact same DOM tree structure.
- **Technical Implementation (How):**
  - **Tool:** `Cheerio` bulk extraction mapped against Phase 2 Geometric Hashes.
  - **Detail:** The orchestrator groups identical `structural_hash` results. It submits ONE "Representative URL" per cluster to the LLM to architect the component schema. It then bulk-processes the remaining URLs in that cluster using classical DOM parsing mapped to the LLM's architecture schema.

## 🚀 Phase 6.3: Dumb Components for Stateful Global Data (Completed)

- **Need:** The LLM injects unwanted `useState` hooks when rebuilding global layout wrappers (e.g. Nav/Footer) causing severe prop-drilling or Next.js hydration issues.
- **Implementation:** React components generated by the system are strictly constrained via the prompt engine to map properties exclusively to top-level `props` with zero internal state awareness.

## 🚀 Phase 6.4: Comprehensive Test Coverage Roadmap (Completed)

- **Need:** Test coverage was previously missing on fail-safes such as AST healing, XML sitemap parsing, and the Pipeline Runner orchestrator bounds.
- **Implementation:** Executed the vectors built out in `p6_04_test_coverage_roadmap.md`, achieving complete test coverage over Engine queues, headless browser memory leaks, LLM streaming interruptions, and JSON object validation.

## 🚀 Phase 7: CMS & Production Sync (Pending)

- **Need:** Push the offline, locally validated migration safely into the authoritative production environment.
- **Technical Implementation (How):** Provide deployment scripts to push local media to Cloudflare R2 and execute programmatic API calls/SQL logic mapping the JSON blueprints into target Content Management Systems or relational databases.
