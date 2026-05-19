# Spec 1.02: Scenario System (`src/crawler/scenarios/`)

**Goal:** Provide programmatic heuristics to ensure the page's visual tree is pristine before capturing spatial geometry (`getBoundingClientRect`). Sticky cookie footers and "Subscribe" modals distort coordinates and must be cleared.

## Architectural Decisions

Adapted directly from the `site-scanner` engine. We will use two broad heuristics to clear blockers without writing custom logic per client site, plus a synthetic scroll behavior to trigger lazy assets.

## Core Scenarios & Modules

### 1. Escape Key Spam Mode (`esc-handler.js`)

Many accessibility-compliant modals, overlays, and sidebars bind to the `Escape` key event.

- **Logic:**
  1.  `await page.keyboard.press('Escape')`
  2.  `await page.waitForTimeout(150)`
  3.  `await page.keyboard.press('Escape')` (To catch nested or delayed overlays)
- **Benefit:** Incredibly robust; clears blockers seamlessly.

### 2. Common Vendor CSS Clicker (`generic-cookie-clicker.js`)

Attempts to find and force-click known consent UI buttons using a predefined array of common selectors.

- **Target Selectors:**
  - `'button[aria-label*="close" i]'`
  - `'button[aria-label*="dismiss" i]'`
  - `'#onetrust-accept-btn-handler'` (Common enterprise consent)
  - `'.CybotCookiebotDialogBodyButton'` (Cookiebot)
- **Logic:**
  1. Loop through selectors.
  2. Try `page.$(selector)`.
  3. If found and visible: `await element.click({ timeout: 1000, force: true })`
  4. Ignore execution errors.

### 3. Synthetic Scroll (Lazy Loading Trigger)

Legacy sites notoriously rely on scroll events to render images, meaning their heights resolve as `0px` if we don't scroll first.

- **Logic:**
  1. Run `window.scrollTo(0, document.body.scrollHeight)` via `page.evaluate`.
  2. `await page.waitForTimeout(500)`
  3. Run `window.scrollTo(0, 0)` to return to the top so geometry calculations are stabilized from `Top: 0`.

---

## Implementation Status

- [ ] Create `src/crawler/scenarios/` directory.
- [ ] Implement `esc-handler.js`.
- [ ] Implement `generic-cookie-clicker.js`.
- [ ] Implement synthetic scroll logic.
- [ ] Create orchestrator to run all scenarios sequentially.

## Verification & Tests

**Test File:** `tests/scenarios.test.js`

**Test Requirements:**

1. **Escape Handler:** Serve a synthetic page with a visible `<dialog>` that closes on `Esc`. Assert that the scenario script hides the element.
2. **Cookie Clicker:** Serve a synthetic page with an element identical to `#onetrust-accept-btn-handler`. Assert that the scenario interacts with it and removes it.

**Execution:**
`npm run test tests/scenarios.test.js`
