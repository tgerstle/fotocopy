# Project Specs: Migration Engine Breakdown

This document translates the high-level project outline into concrete, actionable technical specifications, structured by phase. For each step, we define the **Problem (Need)** and the **Technical Implementation (How)**, leveraging available tools and libraries.

---

## 🛠️ Phase 1: Orchestration Foundation & Discovery

**Objective:** Establish the initial data pipeline, moving from an unconstrained crawl to structured, component-aware data capture.

### **1.1. Adaptive Web Auditing (Crawling Engine)**
*   **Need:** Must reliably crawl complex, modern websites while bypassing client-side anti-scraping measures (e.g., interstitials, cookie banners, interactive modals).
*   **Technical Implementation (How):**
    *   **Tool:** Utilize the existing `site-scanner` infrastructure.
    *   **Detail:** Focus on maximizing Playwright's capabilities within the **Scenario System**. Must build specialized user workflows that execute JavaScript to accept cookies, click necessary "Accept" buttons, and wait for specific visible selectors to resolve before attempting content extraction.
    *   **Deliverable:** A robust Playwright script template that incorporates wait-for-selector logic and event-based flow control.

### **1.2. Visual & Structural Capture**
*   **Need:** Raw text is insufficient. We need to understand the *layout* and *spatial relationship* of content elements (the "box model").
*   **Technical Implementation (How):**
    *   **Tool:** Enhance Playwright integration.
    *   **Detail:** Modify page interaction scripts to execute JavaScript hooks at critical points (e.g., after loading main content). The script must use `elementHandle.evaluate()` to capture:
        1.  `getBoundingClientRect()` for all major parent containers.
        2.  `window.getComputedStyle()` to capture computed layout properties (padding, margin, displayed dimensions).
    *   **Deliverable:** A structured data payload (JSON) attached to the HTML crawl output, containing coordinates and calculated styles for major elements.

### **1.3. Local AI Deployment for Intent**
*   **Need:** Initial classification of scraped content intent without incurring high, real-time API costs.
*   **Technical Implementation (How):**
    *   **Tool:** Ollama running a locally hosted Gemma 2 model.
    *   **Detail:** Develop a pre-processing function that feeds the *scraped structure* (HTML + Bounding Box data, not just raw HTML) to the LLM. The prompt must be highly constrained to force classification into predefined buckets.
    *   **Deliverable:** A local utility wrapper around the Ollama CLI that accepts a structure chunk and returns a standardized intent tag (e.g., `INTENT:HERO`, `INTENT:TEXT_BLOCK`).

---

## 🧩 Phase 2: Structural Intersection & Content Stripping

**Objective:** Filter the noise, isolate the unique, meaningful content, and standardize the design system vocabulary.

### **2.1. Global Region Slicing (Deduplication)**
*   **Need:** To prevent the content database from being polluted by identical headers, footers, or navigation bars that appear on 90%+ of pages.
*   **Technical Implementation (How):**
    *   **Tool:** A structural hashing function implemented in Node.js.
    *   **Detail:**
        1.  Capture the *DOM Tree* (not just the rendered HTML) for all captured pages.
        2.  Generate a **structural hash** for key subtrees (e.g., the main content container).
        3.  Iterate through all hashes. If a hash appears $> 90\%$ of the time, it is tagged `is_global_component: true` and marked for later stripping, preventing it from entering the primary content payload.
    *   **Deliverable:** A pre-processed content payload where global elements are conceptually flagged or excluded.

### **2.2. The Sibling Boundary Rule (Component Isolation)**
*   **Need:** To break the flat, monolithic HTML structure into discrete, self-contained, and reusable "layout blocks."
*   **Technical Implementation (How):**
    *   **Tool:** Logic leveraging the bounding box data from Phase 1.
    *   **Detail:** Analyze the remaining content chunks. Any top-level container element that exhibits:
        1.  A `width: 100%` (or near 100% width based on container analysis).
        2.  A substantial, non-trivial height (`height` > X pixels, where X is determined relative to the viewport).
        3.  Minimal siblings of the same type at the same hierarchical level.
        *   is tentatively marked as a `component_boundary`.
    *   **Deliverable:** A hierarchical representation of the page, structured as an array of `component_boundary` objects.

### **2.3. Design Token Extraction**
*   **Need:** To convert inconsistent, hardcoded, or messy legacy CSS values (colors, fonts, spacings) into a standardized, utility-first system (Tailwind CSS).
*   **Technical Implementation (How):**
    *   **Tool:** Utilizing the CSS frequency map derived from captured `getComputedStyle()` data.
    *   **Detail:**
        1.  Run a parser over all unique `color` and `font-family` values found.
        2.  Implement a color quantization algorithm (or map to a known palette) to reduce the palette to N primary colors.
        3.  Generate a JSON object that adheres to the Tailwind `tailwind.config.js` structure for `theme.extend.colors` and `theme.extend.fontFamily`.
    *   **Deliverable:** A configuration file fragment (e.g., `generated-tokens.json`) ready to be imported into the main build process.

---

## 🧠 Phase 3: AI-Driven Classification & Mapping

**Objective:** Transform the structured, clean layout blocks from Phase 2 into machine-readable, architecturally sound JSON blueprints.

### **3.1. Intent Classification (The Schema Layer)**
*   **Need:** To enforce strict, limited vocabulary for the AI's output, ensuring the resulting JSON only contains recognized component types.
*   **Technical Implementation (How):**
    *   **Tool:** LLM (Gemma 2) constrained by **Zod/JSON Schema**.
    *   **Detail:** The prompt must include the *full, precise* JSON schema definition for the expected output object. The input context to the LLM will be the structured component block from Phase 2.
    *   **Example Schema (Simplified):** `{ "type": "Hero" | "FeatureGrid" | "Accordion" | "RichText", "data": { ... } }`
    *   **Deliverable:** Validated JSON objects matching the schema for every key content block on the page.

### **3.2. Geometry-to-Component Mapping**
*   **Need:** To identify complex component patterns that simple text analysis will miss (e.g., "three boxes next to each other").
*   **Technical Implementation (How):**
    *   **Tool:** Logic layer combining bounding box data (Y-coordinates) with the intent classification.
    *   **Detail:** Group neighboring `component_boundary` elements that share a similar vertical position range. If $N$ elements are found side-by-side (i.e., similar $Y_{min}$ and $Y_{max}$ ranges), they are grouped and mapped to the `FeatureGrid` intent, retaining the individual element's content for its specific "slot" data.
    *   **Deliverable:** A refinement of the JSON structure, explicitly detailing component *slots* within composite components.

### **3.3. React Aria Primitive Scaffolding Output**
*   **Need:** To ensure the blueprint is not just conceptual data, but *ready-to-render* component targets.
*   **Technical Implementation (How):**
    *   **Tool:** Strict adherence to the target component library APIs.
    *   **Detail:** The LLM's final output structure must embed placeholders or specific props/data attributes that map directly to an **RAC** or **JollyUI** implementation. For example, instead of just writing "A Form," the output must specify: `component: "FormBlock", props: { schema_source: "..." }`
    *   **Deliverable:** A finalized, component-property JSON blueprint.

---

## 💻 Phase 4: Local Synthesis & Verification (The Sandbox)

**Objective:** Test the entire pipeline end-to-end on a local machine before touching production infrastructure.

### **4.1. JSON Route Manifest Generation**
*   **Need:** A single source of truth mapping every migrated URL to its structured content blueprint.
*   **Technical Implementation (How):**
    *   **Tool:** A simple build script that aggregates the final JSON blueprints from all processed pages.
    *   **Detail:** For every unique URL processed, generate a companion JSON file: `[slug].json`. This file's primary payload *is* the root component blueprint for that page.
    *   **Deliverable:** A directory structure `/manifests/[slug].json`.

### **4.2. Catch-All Routing Implementation**
*   **Need:** The primary application entry point must be flexible enough to handle any route defined in the manifests.
*   **Technical Implementation (How):**
    *   **Tool:** Next.js `[...slug].js/tsx` route structure.
    *   **Detail:** The catch-all page component must read the `slug` from the URL, locate the corresponding JSON file in the manifests folder, and use that file to drive the rendering of the component structure.
    *   **Deliverable:** A functional, local Next.js route that proves the manifest loading works.

### **4.3. Visual QA Loop**
*   **Need:** To visually validate that the component scaffolding actually renders correctly, especially for interactive parts.
*   **Technical Implementation (How):**
    *   **Tool:** Standard Next.js development workflow (`npm run dev`).
    *   **Detail:** The process requires ensuring that any custom component scaffolds (e.g., a complex data visualization block) are placed into a designated, renderable directory (e.g., `/components/scaffolds/`) and correctly imported/utilized by the catch-all route.
    *   **Deliverable:** Successful local build and visual confirmation of component rendering.

---

## 🚀 Phase 5: Production Deployment & CMS Integration

**Objective:** Move the verified, working local site to the high-availability Cloudflare edge.

### **5.1. Media & Asset Migration**
*   **Need:** All images, SVGs, and documents must be migrated from legacy hosting to a modern, CDN-backed storage solution.
*   **Technical Implementation (How):**
    *   **Tool:** A dedicated Node Asset Manager script.
    *   **Detail:**
        1.  Scan all content blueprints for relative asset URLs.
        2.  Download the source asset (e.g., via direct HTTP request).
        3.  Upload to **Cloudflare R2**.
        4.  Crucially, update *every* instance of the asset URL within the JSON manifests and components to the new `r2://` public URL prefix.
    *   **Deliverable:** All assets in R2, and all content references pointing to R2.

### **5.2. Database Seeding (CMS/SQL)**
*   **Need:** To populate the authoritative content store (both CMS and relational database).
*   **Technical Implementation (How):**
    *   **Tool:** Programmatic API calls within a dedicated deployment script.
    *   **Detail:**
        1.  **Payload CMS:** Use the Payload CMS SDK/API to create or update entries, mapping the structured data from the JSON blueprint to the corresponding field types defined in the CMS structure.
        2.  **D1/SQL:** Write a script that iterates through all blueprints and executes `INSERT`/`UPDATE` statements against the Cloudflare D1 database for relational or key/value data.
    *   **Deliverable:** Successfully populated CMS and D1 instances, representing the site's finalized content model.

### **5.3. Edge Deployment**
*   **Need:** Deploy the finalized Next.js application bundle and configuration files to the edge network.
*   **Technical Implementation (How):**
    *   **Tool:** `npx wrangler deploy` command, orchestrated by OpenNext tooling.
    *   **Detail:** The deployment script must package the entire stack (Next.js code + component scaffolds + manifest definitions) and execute the required wrangler command, ensuring environment variables point to the correct R2/D1 endpoints.
    *   **Deliverable:** A live, working URL on Cloudflare Pages/Workers.