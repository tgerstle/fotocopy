# Phase 6: Structural Clustering & At-Scale Extraction (Overview)

## Objective

To efficiently infer site architecture to dramatically reduce LLM processing load, safely sandbox unpredictable or un-migratable elements, and elegantly handle global data integration dynamically.

## Core Concepts

### 1. Representative Sampling & Bulk Cheerio Extraction

- **Concept:** If 2,000 "Product" pages have the exact same HTML layout structure, running the local LLM 2,000 times represents massive waste of GPU cycles.
- **Mechanism:** Utilizing the hashed geometry maps (Phase 2), the engine clusters identical structural layouts.
- **Execution:**
  - We submit **one Representative URL** from the cluster to the LLM (acting as the Architect) to define the `Product` Component Schema and map the DOM selector paths to those schema keys.
  - The orchestrator pivots to bulk processing: it uses Cheerio to rapidly rip the text/images matching those specific DOM selectors from the remaining 1,999 pages.

### 2. The Plugin Registry & Escape Hatches

- **Concept:** LLMs fail completely when asked to reinvent interactive `<canvas>`, complex third-party booking iframes, or heavy client-side JavaScript calculators.
- **Mechanism:** The LLM prompts are equipped with an "Escape Hatch".
- **Execution:**
  - If recognized as a standard widget (e.g. YouTube, Maps, HubSpot), it is tagged as `PLUGIN: {TYPE}`. These are passed to the CMS as specific Plugin Blocks that map to pre-existing provided React implementations.
  - If unrecognizable, it is tagged as `INTENT: MANUAL_INTERVENTION` and `INTENT: EXTERNAL_WIDGET`. The CMS payload generates a "Placeholder UI Component" (a bright bounding box) ensuring the pipeline continues smoothly without failing silently, flagging the spot for human refactoring.

### 3. Global Data UI Disconnection (Dumb vs Smart Components)

- **Concept:** Components that mutate or access global site data (e.g., Live Search, Featured Posts, Shopping Cart) cannot be entirely scraped because they are stateful.
- **Mechanism:** We decouple the UI design from the live data state.
- **Execution:**
  - The LLM visually generates the "Dumb Component" in Storybook based strictly on the snapshot HTML state (e.g. the visual grid of the search results block as caught at the exact time of the crawl).
  - The React code exposes the data points as standard props instead of hardcoding text.
  - In Phase 7 (CMS/Deployment), a developer manually wraps this dummy component in a React Server Component that fetches the live CMS data and injects it into the generated Storybook-validated UI components.
