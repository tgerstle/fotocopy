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
pnpm install
```

---

## 🕹 Usage

Fotocopy relies on a central SQLite-backed pipeline runner (`pipeline_runner.ts`) to execute the state machine pipeline chronologically in batches. It features automated error aggregation—meaning independent job failures are isolated, skipped, and reported in a summary table at the end so the pipeline doesn't crash entirely.

### Configuration

Fotocopy is configured primarily through a `fotocopy.config.ts` file located in the root of your workspace. This file defines global settings like:

- **URL Discovery**: Target URLs, Sitemap URLs, and static URL lists.
- **LLM Configuration**: The local model to use (e.g., `gemma4:26b`), endpoint, temperature, and timeout limits.
- **Plugins**: Specific DOM matching rules and escape hatches.

**Note:** Command Line Interface (CLI) flags always take precedence over the file-based configuration. If you provide a flag in the CLI, it will dynamically override the corresponding setting from your `fotocopy.config.ts` for that run.

### Running the Pipeline

You can run the migration from the root of the project using the mapped pnpm scripts.

To run the pipeline against a specific URL, you can optionally specify a custom output directory before the target URL. Note that with `pnpm run`, you do **not** need to use `--` before the custom flags:

```bash
pnpm run migrate ./my-custom-output --target-url https://www.example.com/ --force --llm-timeout 900000
```

### CLI Arguments & Flags

- `[output-dir]`: (Optional) The first positional argument defines where the data is saved. Defaults to `./output` relative to the current working directory.
- `-c, --config <path>`: Path to a custom fotocopy config file (defaults to `fotocopy.config.ts` in the current working directory).
- `--target-url <url>`: **"Sniper Mode"**. Runs the exact pipeline against a single URL for component extraction, ignoring the static URL lists or spiders specified in the config.
- `-f, --force`: Resets the SQL database queue state for this URL back to `DISCOVERED` and forces the pipeline to overwrite and regenerate all extracted chunk models, sandbox files, and compiled React components.
- `--run-spider`: Seeds the local DB from the configured sitemap before processing.
- `--llm-timeout <ms>`: Overrides the local LLM fetch timeout in milliseconds (useful for heavier models that need more time to process without editing the config file).

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
pnpm run storybook
```

This starts a local development server at `http://localhost:6006/` where you can interact visually with the exact components the LLM scaffolded, safely sandboxed from the rest of the application.

---

## 🛠 Troubleshooting

- **Headers Timeout Error:** If the LLM integration encounters timeout issues (`UND_ERR_HEADERS_TIMEOUT`), ensure Ollama is actively running in the background and has enough system resources allocated.
- **Pipeline Failures/Code Formatting:** If a specific component crashes generation, the pipeline runner will catch the `PipelineError` and output a summary table at the end. To retry specific components without completely restarting the crawler, you can use the `--force` flag on the target URL.
- **Stale Files/Ghost Components:** Because components output sequentially, using `--force` will force React files to overwrite themselves. If old component files are still clinging around, delete the target's output cache directory completely (`rm -rf output/<domain>`) and run `--force`.

## 📜 Legal / Licensing

_(Add your license constraints here)_
