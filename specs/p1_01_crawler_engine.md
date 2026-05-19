# Spec 1.01: Crawler Engine (`src/crawler/engine.js`)

**Goal:** Create a highly defensive Playwright loop designed to navigate legacy sites, capture fully hydrated DOMs without stalling, and save snapshot artifacts.

## Architectural Decisions

Relying on standard scraping (`waitUntil: 'networkidle'`) fails on legacy sites due to pixel trackers and hanging analytical scripts. We will implement the defensive navigation patterns learned from `site-scanner`.

## Execution Flow

1.  **Launch Context:**
    - Launch Chromium via Playwright (`headless: true`).
    - Initialize a fresh Context and Page strictly enforcing a fixed Viewport geometry (`{ width: 1920, height: 1080 }`). _This prevents geometry collapse across different page lengths caused by responsive shifts._
2.  **Defensive Navigation & Scrollbar Prep:**
    - Navigate using `page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 })`. This strictly ensures the main HTML tree is constructed and unblocks our next steps.
    - Inject CSS early to hide scrollbars globally (`::-webkit-scrollbar { display: none; }`). _This guarantees pixel math for 100% width elements isn't corrupted by OS-level scrollbar injection._
3.  **Heuristic Soft Wait:**
    - Execute `page.waitForLoadState("networkidle", { timeout: 5000 })`.
    - If it times out, _catch the error and proceed anyway_. This gives dynamic content up to 5 seconds to settle without fatalizing the process if an ad banner refuses to close.
4.  **Scenario Bypass (Interstitials & Lazy Loads):**
    - Run imported modules from the Scenario System (see `p1_02_scenario_system.md`).
    - This clears pop-ups and triggers lazy images.
5.  **Injection & Extraction:**
    - Use `page.evaluate()` to inject the DOM parser script (see `p1_03_dom_parser_injector.md`).
    - Awaits returning the deeply mapped layout + accessibility JSON tree.
6.  **Snapshot Storage:**
    - Save raw markup and the returned structural JSON to `data/raw_snapshots/{route_slug}.json`.
7.  **Teardown:**
    - Closes browser context.

---

## Implementation Status

- [ ] Initialize `src/crawler/engine.js` with Playwright dependency.
- [ ] Implement `crawlPage` with defensive navigation / soft wait.
- [ ] Implement scenario bypass triggers.
- [ ] Implement DOM script injection logic.
- [ ] Implement file-system saving to `data/raw_snapshots/`.

## Verification & Tests

**Test File:** `tests/crawler_engine.test.js`

**Test Requirements:**

1. **Defensive Load:** Point crawler at a synthetic local page that never reaches `networkidle` (e.g., an infinite polling script). Assert that the crawler successfully catches the 5s timeout and proceeds without crashing.
2. **Snapshot Write:** Assert that calling the engine successfully writes a non-empty `route_slug.json` to the `data/raw_snapshots/` directory.

**Execution:**
`npm run test tests/crawler_engine.test.js`
