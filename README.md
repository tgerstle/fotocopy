# 🤖 Fotocopy

**Fotocopy** is an Automated Legacy Migration Engine. It is a programmatic, multi-layer pipeline designed to safely and cleanly transition legacy client websites into modern, structured, component-centric architectures (e.g., Next.js, React, Tailwind CSS, and headless CMSs).

Built with a **"Frontend-First, CMS-Last"** methodology, Fotocopy ingests unpredictable HTML from aging sites, surgically transforms it via structural DOM geometry analysis, and utilizes localized machine learning (LLMs) to infer layout intent and generate modern React UI components.

---

## 🏗 Architecture & Capabilities

1. **Playwright Crawler & DOM Extraction:** Operates in a strict `1920x1080` viewport, navigating past modals and banners. It takes a structural DOM snapshot extracting design tokens, component geometry (`getBoundingClientRect`), and accessibility metadata.
2. **Computational Slicer (Geometry Hashing):** Analyzes the raw layout data and mathematically hashes duplicate geometric footprints (like global Headers and Footers) across the entire site to isolate singleton shells vs. localized page chunks.
3. **LLM Vision Classification (Ollama):** "Bottom-up" semantic inference. Local LLMs review the chunks and map the visual blocks to strict Zod CMS schemas identifying component types (e.g., `Hero`, `StaffGrid`, `RichText`).
4. **Auto-Scaffolding & Sandbox Extraction:** Fotocopy automatically extracts a complete, isolated React+Vite testing sandbox into the output folder. It acts as a live development server tailored to the newly migrated components.
5. **Self-Healing LLM Generation & AST Guards:** Component generators prompt LLMs to emit strict Tailwind CSS React components (`.tsx`) and Storybook stories bound to the site's extracted W3C design tokens. An automated AST syntax guard immediately validates, diagnoses, and "heals" malformed TypeScript code during code generation.
6. **Asset Mirroring:** Downloads images and assets directly to local storage to ensure the migrated design works 100% offline.

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your system:

- **Node.js** (v18+)
- **Ollama** (for local LLM execution). Ensure Ollama is running and you have pulled a capable model (e.g., `ollama run llama3`).
- **SQLite** (Native dependencies must be buildable on your OS).

### Installation

Clone the repository and install dependencies:

```bash
git clone <your-repo>
cd fotocopy
npm install
cd packages/core
npm install
```

---

## 🕹 Usage

Fotocopy relies on a central SQLite-backed pipeline runner (`pipeline_runner.ts`) to execute the state machine pipeline chronologically in batches. It features automated error aggregation—meaning independent job failures are isolated, skipped, and reported in a summary table at the end so the pipeline doesn't crash entirely.

### Running the Pipeline

You can run the migration from the root of the project using the mapped NPM scripts.

To run the pipeline against a specific URL, you can optionally specify a custom output directory before the target URL. Because we are passing arguments through `npm run`, you must use `--` before the custom flags:

```bash
npm run migrate -- ./my-custom-output --target-url https://css-snacks.com/ --force
```

- `[output-dir]`: (Optional) The first positional argument defines where the data is saved. Defaults to `./output` relative to the current working directory.
- `--target-url`: The website you want to ingest and migrate.
- `--force`: Resets the SQL database queue state for this URL back to `DISCOVERED` and forces the pipeline to overwrite and regenerate all extracted chunk models, sandbox files, and compiled React components.

### Pipeline Execution Phases

When you run the command, you will see Fotocopy move through its automated phases:

1. **DISCOVERED:** Playwright crawls the URL, extracts Tokens/Geometry/A11y, and serializes the DOM.
2. **CRAWLED:** Computes the Global Intersections across captured pages (identifies Layout singletons).
3. **HASHED:** Slices the DOM into discrete visual chunks and passes them to the local LLM for classification.
4. **CLASSIFIED:** Hydrates the extracted data into strict CMS Schemas and auto-scaffolds standard UI shells and global components into the local output sandbox.

---

## 📂 Understanding the Output

All artifacts, caches, and generated code are isolated in the workspace output directory.
By default, this lives at: `output/[your-target-domain.com]/`

Key directories to explore after a run:

- **`/hydration/`**: Contains the final structured CMS blueprint (e.g., `domain.com__cms.json`). This strict JSON structure is ready to be injected into a Headless CMS.
- **`/src/components/globals/` & `/src/components/standard/`**: Contains the LLM-generated React components and their corresponding Storybook stories (e.g., `Navigation.tsx`, `Navigation.stories.tsx`). These are styled strictly using semantic Tailwind CSS variables, validated by the AST guard.
- **`/chunks/`**: The localized mathematical JSON chunks mapping out the geometrical footprint of the original DOM.
- **`/llm_outputs/`**: Verification outputs produced by Ollama during categorization.
- **`fotocopy.components.json`**: The consolidated Component Manifest registry identifying all unified blocks across the entire crawl space.

---

## 🎨 Viewing the Scaffolded Components

As the pipeline runs, the `sandbox_extractor.ts` routine copies a full Vite + React testing sandbox directly into the target output folder (e.g. `output/css-snacks.com/`), and wires up the LLM-generated files to it.

To view the generated components:

```bash
# Move into the generated workspace
cd output/css-snacks.com

# Start the local isolated Storybook environment
npm run storybook
```

This starts a local development server at `http://localhost:6006/` where you can interact visually with the exact components the LLM scaffolded, safely sandboxed from the rest of the application.

---

## 🛠 Troubleshooting

- **Headers Timeout Error:** If the LLM integration encounters timeout issues (`UND_ERR_HEADERS_TIMEOUT`), ensure Ollama is actively running in the background and has enough system resources allocated.
- **Pipeline Failures/Code Formatting:** If a specific component crashes generation, the pipeline runner will catch the `PipelineError` and output a summary table at the end. To retry specific components without completely restarting the crawler, you can use the `--force` flag on the target URL. 
- **Stale Files/Ghost Components:** Because components output sequentially, using `--force` will force React files to overwrite themselves. If old component files are still clinging around, delete the target's output cache directory completely (`rm -rf output/<domain>`) and run `--force`.

## 📜 Legal / Licensing

_(Add your license constraints here)_
