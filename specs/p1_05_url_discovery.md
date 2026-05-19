# Spec 1.05: URL Discovery & Intake Valve (`src/crawler/discovery.js`)

**Goal:** Define how the migration engine acquires its list of target URLs. Provide a deterministic intake mechanism to populate the State Ledger (`.fotocopy/state.json`) before the heavy extraction pipeline begins.

## Architectural Decision: Deterministic vs. Dynamic Crawling

**Question:** _Should URLs be generated in the process of crawling, or should the crawl be defined by provided pages?_

**Answer:** The crawl MUST be defined by a strictly provided list of pages.

If we allow the Playwright crawler to spontaneously "spider" (follow `<a href>`) while simultaneously doing heavy DOM extraction and LLM inference, we introduce massive liability:

1.  **Infinite Loops & Junk:** Calendars, search facets (`?sort=price`), and broken pagination can trap the crawler.
2.  **Opaque Scope:** We lose the ability to accurately estimate LLM token costs or total migration time upfront.
3.  **State Management Chaos:** Dynamically adding to the Dead Letter Queue or State Ledger mid-crawl makes resumability highly complex.

Therefore, "Discovery" and "Extraction" are explicitly separated.

## Execution Flow

### 1. The Intake Config

The global `fotocopy.config.ts` accepts an intake parameter:

```typescript
export default {
  intake: {
    type: "sitemap", // or "csv"
    source: "https://legacy-site.com/sitemap.xml", // or "./legacy-urls.csv"
  },
};
```

### 2. The Initialization Script (`npm run cli:init`)

Before the Playwright engine boots up, a lightweight initialization script runs.

1.  **Parse Source:**
    - If `sitemap`: Uses a standard XML parser to hit the remote sitemap and extract all `<loc>` tags.
    - If `csv`: Reads a local CSV file. (A CSV is highly recommended because it allows the client to manually delete pages they don't want to migrate before we spend AI tokens on them).
2.  **Ledger Population:**
    - The script validates the URLs and populates `.fotocopy/state.json`.
    - Example: Creates 500 rows of `{ "url": "...", "status": "pending_capture" }`.

### 3. Optional: The Spidering Tool

What if the legacy site doesn't have a sitemap?

We provide a standalone utility script (`npm run cli:spider <domain>`).

- This uses a fast, lightweight HTTP crawler (like `cheerio`, NOT Playwright) to rapidly map the site.
- It does _not_ do any data extraction or DOM stamping.
- Its only output is a local `legacy-urls.csv`.
- The human engineer reviews this CSV, cleans out the junk, and then sets the config to `intake.type = "csv"`.

## Verification & Tests

- **Sitemap Test:** Feed a mock XML string to the parser and assert it correctly provisions the state ledger.
- **CSV Test:** Feed a CSV string to the parser and assert it configures the ledger properly.
