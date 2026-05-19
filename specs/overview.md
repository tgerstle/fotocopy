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

### Phase 1: Orchestration Foundation & Discovery

The initial stage establishes a Node.js orchestration layer designed to crawl and snapshot existing digital properties accurately. The crawler heavily leverages **Contract-Driven Testing**, benchmarking its raw layout extraction and HTML dumping against our strictly typed Zod schemas. The benchmark site for pipeline development is `css-snacks.com`.

- **Global Configuration & Hooks (`fotocopy.config.ts`):** The orchestration engine is built to be strictly site-agnostic. All site-specific logic (e.g., LLM host endpoints, page categorization regex routing, and pre/post payload hooks) is defined in a standard user configuration file injected into the pipeline at runtime.
- **Adaptive Crawler Repurposing:** We utilize our existing **Adaptive Web Auditor (site-scanner)**. Its robust **Scenario System** is heavily relied upon to navigate logic-gate blockers like modals, cookie banners, and interstitials that reliably derail standard scrapers.
- **Visual Box Model Capture:** Playwright is configured not merely as a text-scraper but as a layout engine context. It captures spatial logic via `getBoundingClientRect()` and `getComputedStyle()`, retaining actual component geometry.
- **Cost-Efficient Local AI Inference:** To bypass exorbitant API overhead for thousands of page executions, we deploy **Ollama utilizing the Gemma 2 model** locally. It serves as the primary inference engine for resolving component layout intents.

### Phase 2: Structural Intersection & Content Stripping

Before LLM classification happens, the dataset must be purged of repetitive noise, and global templates must be recognized to prevent redundant processing.

- **Global Region Slicing (Hashing):** The engine executes a structural hashing function across multiple generated DOM trees. Elements identified on >90% of a site's pages are algorithmically flagged as global boundaries (Header/Footer/Sidebar) and purged from the primary page payload.
- **Template Inference & Collection Mapping:** The engine analyzes URL topologies (e.g., `/blog/*`) and compares the structural DOM hashes of the stripped content. If 50 pages share identical DOM geometry and semantic tags (like `og:type="article"`), they are clustered into a "Page Type/Collection" (e.g., `Blog Post`). This allows the CMS to seed them into typed Collections rather than generic ad-hoc blocks.
- **The Sibling Boundary Rule:** For unique, ad-hoc pages (Home, About), the remaining content is parsed into isolated, horizontal layout blocks. A top-level container that spans 100% viewport width with a substantial height is automatically detected as a component boundary.
- **Design Token Extraction:** The system aggregates a CSS frequency map of the site to automatically generate a unified **Tailwind CSS theme configuration**, effectively converting chaotic legacy inline styles, HEX codes, and fonts into standard utility classes.

### Phase 3: AI-Driven Classification & Data Structuring (The Heavy Lifting)

This phase serves as the data transformation engine. Local LLMs handle the token-heavy processing of massive HTML dumps to generate strictly validated data structures without accruing API costs.

- **Local Machine Learning:** The local `gemma4:e4b` model (via Ollama) handles all the brute-force processing. It is explicitly constrained via **Zod & JSON schemas** (Structured Outputs) to output classified intent arrays.
- **Geometry-to-Schema Mapping:** Gemma uses the visual data previously acquired (spatial logic) to map raw chunks exclusively to approved CMS schema targets: e.g., `Hero`, `FeatureGrid`, `Accordion`, `FormBlock`.
- **Absolute Data Fidelity:** Gemma is forbidden from writing the final copy. It uses an "ID Pointer Pattern" to map components back to raw DOM nodes, leaving literal string-extraction to the Node orchestrator.

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
