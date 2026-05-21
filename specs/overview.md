# Project Overview: Automated Legacy Migration Engine

**Goal:** To engineer a programmatic, multi-layer engine that successfully transitions legacy client websites into modern, structured, and globally distributed front-end applications running on the Cloudflare edge.

**Methodology:** **"Frontend-First, CMS-Last"**. The engine strictly prioritizes isolating logic, layout, and structural data integrity (the "what") prior to interfacing with the final deployment layer and content management system (the "where").

**Core Concept:** The engine ingests deeply nested, unpredictable HTML from aging sites, surgically transforms it via structural DOM analysis and localized machine learning, and produces strict JSON blueprints. These blueprints seed a headless CMS seamlessly, resulting in zero-loss migrations into a highly optimized, component-centric architecture.

---

## Core Architectural Principles

### 1. Desktop-as-Source-of-Truth / Responsive-by-Design

Attempting to crawl mobile and desktop versions of a legacy site creates unresolvable data-reconciliation conflicts (e.g., hidden content on mobile, diverged DOM nodes).

- **The Crawl:** The crawler enforces a strict, massive viewport (`1920x1080`). It acts as the absolute source of truth for retrieving max payload data and layout logic.
- **The Result:** The Next.js frontend handles mobile natively. Scaffolding frameworks (like React Aria / JollyUI) and Tailwind CSS automatically re-flow the structured JSON payloads into flawless mobile web elements.

### 2. URL Integrity & SEO Preservation

Losing SEO equity during a migration is catastrophic. Information architecture is preserved at two levels:

- **1:1 Path Duplication:** The crawler records the exact `window.location.pathname` during extraction. The resulting sandbox JSON output (`data/final_manifests/about/team.json`) is digested by a Next.js **Catch-All route** (`[[...slug]].tsx`), generating an identical live URL (`/about/team`).
- **301 Redirect Mapping:** If URLs _must_ change, a `redirects.csv` ledger is compiled recursively alongside the crawl and passed to the Cloudflare Pages deploy configuration `_redirects` file automatically.

### 3. Absolute Asset Mirroring (Local-First Sync)

The engine does not link out to legacy domains for images or stylesheets, nor does it rely on cloud services to preview the migrated site locally.

- **Extraction:** The DOM parser traps `src` attributes, `<picture>` wrappers, and CSS `background-images`.
- **Local Caching:** A Node asset manager downloads these files directly into the Next.js `public/migrated-media/` directory. The JSON blueprints use these local `/migrated-media/...` paths so the entire migrated site runs perfectly on `localhost` without wifi.
- **Production Sync:** During Phase 5, the locally vetted `migrated-media` directory is bulk-synced to **Cloudflare R2**, and the CMS seeder updates the paths from local URLs to the live CDN URLs.

---

## Migration Engine Execution Phases

### Phase 0: Tracer Bullet (Demo Pipeline)

**Goal:** Prove the data structure works _first_.
We build the final output—a Next.js site powered by mock JSON—_before_ writing any extraction logic. This live sandbox acts as a testbed for schema changes during development before backend code is written.

### Phase 1: Orchestration Foundation & Discovery (Completed)

The initial stage establishes a Node.js orchestration layer designed to crawl and snapshot existing digital properties accurately. The crawler heavily leverages **Contract-Driven Testing**, benchmarking its raw layout extraction and HTML dumping against our strictly typed Zod schemas. The benchmark site for pipeline development is `css-snacks.com`.

- **Global Configuration & Hooks (`fotocopy.config.ts`):** The orchestration engine is built to be strictly site-agnostic. All site-specific logic (e.g., LLM host endpoints, page categorization regex routing, and pre/post payload hooks) is defined in a standard user configuration file injected into the pipeline at runtime.
- **Adaptive Crawler Repurposing:** We utilize our existing **Adaptive Web Auditor (site-scanner)**. Its robust **Scenario System** is heavily relied upon to navigate logic-gate blockers like modals, cookie banners, and interstitials that reliably derail standard scrapers.
- **Visual Box Model Capture:** Playwright is configured not merely as a text-scraper but as a layout engine context. It captures spatial logic via `getBoundingClientRect()` and `getComputedStyle()`, retaining actual component geometry. (Added computed positions, widths, and background colors to facilitate offline math).

### Phase 2: Structural Intersection & Content Stripping (Completed)

Before LLM classification happens, the dataset must be purged of repetitive noise, and global templates must be recognized to prevent redundant processing. We rely on mathematically offline tag-agnostic parsing rather than raw HTML scraping.

- **Global Region Slicing (Hashing):** The engine executes a structural hashing function across multiple generated DOM trees (`hash_engine.ts`). Elements identified on >90% of a site's pages are algorithmically flagged as global boundaries (Header/Footer/Sidebar) based on their structural topology.
- **The Purge Sync:** The `orchestrator.ts` script takes the generated global signatures and physically deletes matching DOM nodes via `data-awa-id` bindings, preventing global "div soup" from muddying inference payload arrays.
- **Template Inference & Collection Mapping:** The engine analyzes URL topologies (e.g., `/blog/*`) and compares the structural DOM hashes of the stripped content (`template_inference.ts`). If pages share identical DOM geometry, they are clustered into a "Page Type/Collection" (e.g., `Blog Post`).
- **The Sibling Boundary Rule:** For unique, ad-hoc pages (Home, About), the remaining content is parsed into isolated, horizontal layout blocks (`chunk_slicer.ts`). Boundaries are formed mathematically evaluating parent-width thresholds, margin gulfs, semantic delineators, and background color shifts, while bypassing sticky/absolute positioned elements entirely.

### Phase 3: AI-Driven Classification & Data Structuring (Completed)

This phase serves as the data transformation engine. Local LLMs handle the token-heavy processing of massive HTML dumps to generate strictly validated data structures without accruing API costs.

- **Offline Machine Learning API:** The local model (via Ollama REST) handles all chunk processing in `ollama_client.ts`. It is explicitly constrained by bridging TS Zod boundaries to `zod-to-json-schema`, passing JSON schemas natively into the `gemma` inference to demand perfectly modeled Structured Outputs.
- **Geometry-to-Component Discovery:** The `batch_classifier.ts` iteratively passes Phase 2 layout chunks to the LLM backend. Rather than strictly forcing components into restricted buckets (e.g. `Hero`), the LLM acts as a Layout Architect, organically inventing contextual blockTypes (`inferredBlockType: StaffGrid`). These discovered variants are programmatically grouped/clustered locally later.
- **Absolute Data Fidelity (The Hydration Scale):** The model is forbidden from answering with original text content. It returns a pure "ID Pointer Pattern" mapping `nodeId` coordinates. The Node orchestrator's `hydrator.ts` uses Cheerio to directly query `nodeMap.json` and perfectly hydrate the literals, ending AI hallucinations permanently spanning text.
- **Pipeline Observability & CLI Diagnostics:** The orchestrator allows isolating specific phases utilizing runtime arguments (e.g., `--step=2 --verbose`). This yields powerful debugging by forcefully pausing migrations so you can visually verify bounded layouts or DOM geometries without being forced through the full extraction pipeline continuously.
- **Component Consolidation & Concurrency Scaling:** The offline generation loop employs `p-limit` caps safely saturating native GPU RAM blocks. A final bridging phase inside `consolidator.ts` scans all structural objects spanning the outputs, discovering unique layouts mathematically to build a single `fotocopy.components.json` manifest dictionary limiting Phase 4 payload sizes securely.

### Phase 4: Component Scaffolding & Local Verification (Advanced LLMs)

With the raw data perfectly structured into JSON and Design Tokens extracted, advanced frontier models (e.g., via GitHub Copilot) are unleashed to generate the actual codebase. Pages are not hardcoded; they are dynamically assembled using a "Block Factory" routing pattern.

- **Auto-Generated Copilot Prompts:** The Node orchestrator scans the JSON metadata and generates strict `.prompt.md` files for each component type (e.g., `HeroBlock.prompt.md`). Copilot reads these specific prompts inside VS Code to generate mathematically perfect React/Tailwind components exactly matched to the data.
- **JSON Route Manifests:** The compiler generates a physical JSON artifact for every single route (e.g., `/data/manifests/about-us.json`). This file contains a linear array of Component Blocks.
- **The Catch-All Block Factory:** A dynamic **Next.js catch-all route** (`app/[...slug]/page.tsx`) acts as the page builder. It matches the URL slug, reads the corresponding JSON manifest, loops over the array, and dynamically renders the Copilot-generated UI components (e.g., `<HeroBlock {...props} />`).
- **Local Asset Harvesting:** A Node.js manager downloads all legacy media directly to `/public/migrated-media/`. The JSON files use these local paths, completely decoupling the sandbox from the web. Visual QA is executed offline via `npm run dev`.

### Phase 5: Production Deployment & CMS Integration

Because Next.js was built to consume an array of JSON objects, the handoff to the CMS is a perfectly frictionless 1:1 translation.

- **Payload CMS "Blocks" & "Collections" Mapping:** Payload CMS natively supports a schema type called a **"Blocks Field"** for ad-hoc pages (Home, About). For identified templates (from Phase 2), we map data directly to rigid **Collections** (e.g., `Posts`, `Products`) using defined fields (Title, Content, Featured Image).
- **Headless Database Seeding:** A Node script iterates through `/data/manifests/*.json` and `POST`s the arrays directly to the Payload CMS Local/REST API. The data perfectly aligns with Payload's Block Fields or Collection schemas based on the inferred Page Type.
- **Data Source Toggle:** We swap an environment variable in Next.js (e.g., `DATA_SOURCE=payload`). The _exact same_ Catch-All Route from Phase 4 now fetches the JSON arrays from Payload CMS instead of the local filesystem. No frontend code is altered.
- **R2 CDN Sync:** The locally cached media is pushed to Cloudflare R2 object storage, and the CMS seeding scripts update the database string paths dynamically.
- **Zero-Server Edge Deployment:** The entire ecosystem is deployed to Cloudflare Workers via **OpenNext** (`npx wrangler deploy`).

---

## Financial & Operational Model

The strategic usage of the Cloudflare stack radically modifies standard agency operating cost paradigms.

- Because **Cloudflare D1** (database) and **R2** (object storage) provide vast free-tier execution and storage limits, we can aggregate **15–20 distinct client site projects** strictly under a singular **$5/month Cloudflare Workers subscription**.
- This lack of recurring fractional AWS/Vercel fees creates staggering profit margins for long-term retainer migration & hosting contracts, offering both deep resilience and unparalleled multi-tenant edge capabilities.

**Workspace Architecture:** The project uses NPM Workspaces to manage individual domains (demo-frontend, demo-pipeline) to streamline lockfiles and dependency execution.
