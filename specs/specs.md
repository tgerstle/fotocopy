# Project Specs: Migration Engine Breakdown

This document translates the high-level project outline into concrete, actionable technical specifications, structured by phase. For each step, we define the **Problem (Need)** and the **Technical Implementation (How)**, leveraging available tools and libraries.

---

## 🛠️ Phase 1: Orchestration Foundation & Discovery

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

### **2.3. Design Token Extraction**

- **Need:** To convert inconsistent, hardcoded, or messy legacy CSS values (colors, fonts, spacings) into a standardized, utility-first system (Tailwind CSS).
- **Technical Implementation (How):**
  - **Tool:** Utilizing the CSS frequency map derived from captured `getComputedStyle()` data.
  - **Detail:**
    1.  Run a parser over all unique `color` and `font-family` values found.
    2.  Implement a color quantization algorithm (or map to a known palette) to reduce the palette to N primary colors.
    3.  Generate a JSON object that adheres to the Tailwind `tailwind.config.js` structure for `theme.extend.colors` and `theme.extend.fontFamily`.
  - **Deliverable:** A configuration file fragment (e.g., `generated-tokens.json`) ready to be imported into the main build process.

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

## 💻 Phase 4: Local Synthesis & Verification (The Sandbox)

**Objective:** Test the entire pipeline end-to-end on a local machine before touching production infrastructure.

### **4.1. JSON Route Manifest Generation**

- **Need:** A single source of truth mapping every migrated URL to its structured content blueprint.
- **Technical Implementation (How):**
  - **Tool:** A simple build script that aggregates the final JSON blueprints from all processed pages.
  - **Detail:** For every unique URL processed, generate a companion JSON file: `[slug].json`. This file's primary payload _is_ the root component blueprint for that page.
  - **Deliverable:** A directory structure `/manifests/[slug].json`.

### **4.2. Catch-All Routing Implementation**

- **Need:** The primary application entry point must be flexible enough to handle any route defined in the manifests.
- **Technical Implementation (How):**
  - **Tool:** Next.js `[...slug].js/tsx` route structure.
  - **Detail:** The catch-all page component must read the `slug` from the URL, locate the corresponding JSON file in the manifests folder, and use that file to drive the rendering of the component structure.
  - **Deliverable:** A functional, local Next.js route that proves the manifest loading works.

### **4.3. Component Prompt & Auto-Scaffolding Generation**

- **Need:** Transform the structured LLM block definitions from Phase 3 into physical React `.tsx` code.
- **Technical Implementation (How):**
  - **Tool:** Prompt Generator & Ollama (LLM Wrapper).
  - **Detail:** Construct rich Copilot prompts using standard React and semantic HTML skills alongside inferred component schemas. If configured (`autoGenerateComponents: true`), the system routes these prompts back through the LLM to directly write the physical `.tsx` files bridging Next.js to Tailwind tokens.
  - **Deliverable:** Generated `.prompt.md` files for manual Copilot usage, or physical `.tsx` boilerplate outputted directly to `output/components/`.

### **4.4. Visual QA Loop**

- **Need:** To visually validate that the component scaffolding actually renders correctly, especially for interactive parts.
- **Technical Implementation (How):**
  - **Tool:** Standard Next.js development workflow (`npm run dev`).
  - **Detail:** The process requires ensuring that any custom component scaffolds generated are placed into a designated, renderable directory (e.g., `/demo-frontend/src/components/`) and correctly imported/utilized by the catch-all route.
  - **Deliverable:** Successful local build and visual confirmation of component rendering.

---

## 🚀 Phase 5: Production Deployment & CMS Integration

**Objective:** Move the verified, working local site to the high-availability Cloudflare edge.

### **5.1. Global Layout Scaffolding (Singletons)**

- **Need:** Extract shared application shells (Headers, Navigations, Footers) and generate strict wrapper components around Next.js `children`.
- **Technical Implementation (How):**
  - **Tool:** Global Classifier and Global Prompt Generator.
  - **Detail:** Iterating across the purged structural layout nodes (removed by the hashing orchestrator in Phase 2.1), we pass isolated chunks into the LLM classifier specifically requesting Singleton definitions alongside reference HTML. We then generate Copilot Prompts appending the `children` prop architecture rules.
  - **Deliverable:** Individual Markdown files describing overarching global shell layouts (e.g., `Navigation.prompt.md`), ready for Next.js Layout rendering.

### **5.2. Media & Asset Migration**

- **Need:** All images, SVGs, and documents must be migrated from legacy hosting to a modern, CDN-backed storage solution.
- **Technical Implementation (How):**
  - **Tool:** A dedicated Node Asset Manager script.
  - **Detail:**
    1.  Scan all content blueprints for relative asset URLs.
    2.  Download the source asset (e.g., via direct HTTP request).
    3.  Upload to **Cloudflare R2**.
    4.  Crucially, update _every_ instance of the asset URL within the JSON manifests and components to the new `r2://` public URL prefix.
  - **Deliverable:** All assets in R2, and all content references pointing to R2.

### **5.3. Database Seeding (CMS/SQL)**

- **Need:** To populate the authoritative content store (both CMS and relational database).
- **Technical Implementation (How):**
  - **Tool:** Programmatic API calls within a dedicated deployment script.
  - **Detail:**
    1.  **Payload CMS:** Use the Payload CMS SDK/API to create or update entries, mapping the structured data from the JSON blueprint to the corresponding field types defined in the CMS structure.
    2.  **D1/SQL:** Write a script that iterates through all blueprints and executes `INSERT`/`UPDATE` statements against the Cloudflare D1 database for relational or key/value data.
  - **Deliverable:** Successfully populated CMS and D1 instances, representing the site's finalized content model.

### **5.4. Edge Deployment**

- **Need:** Deploy the finalized Next.js application bundle and configuration files to the edge network.
- **Technical Implementation (How):**
  - **Tool:** `npx wrangler deploy` command, orchestrated by OpenNext tooling.
  - **Detail:** The deployment script must package the entire stack (Next.js code + component scaffolds + manifest definitions) and execute the required wrangler command, ensuring environment variables point to the correct R2/D1 endpoints.
  - **Deliverable:** A live, working URL on Cloudflare Pages/Workers.
