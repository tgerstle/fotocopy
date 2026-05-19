# Spec 1.03: DOM Parser Injector (`src/crawler/inject/dom-parser.js`)

**Goal:** Formulate a browser-side payload to surgically extract the exact nodes, structural context, and design tokens needed by the LLM without returning bloated inner-HTML.

## Architectural Decisions

Relying entirely on text content leads to terrible AI hallucination. By grabbing standard accessibility signatures and spatial geometry, we give the LLM literal blueprints of an element's structural weight on a page.

## Execution Flow inside `page.evaluate()`

1.  **Extract SEO & Head Metadata:**
    - Before traversing the visual body, query the `<head>` to map SEO essentials.
    - Capture `<title>`, `<meta name="description">`, OpenGraph tags (`og:title`, `og:image`, etc.), and `<link rel="canonical">`.
    - This is extracted into a standalone `seo` JSON object.

2.  **Traverse the DOM Tree & ID Stamping:**
    - Walk the document visual tree, strictly restricted to `<body>`.
    - Inject a unique sequential ID into the actual DOM node: `el.setAttribute('data-awa-id', id)`. _This supports the absolute data-fidelity ID Pointer Pattern in Pass 5._
    - Filter out invisible elements `(el.offsetWidth === 0 && el.offsetHeight === 0)`, script tags, and SVGs (to prevent token bloat).

3.  **Capture Geometry (Spatial Math):**
    - Execute `el.getBoundingClientRect()`.
    - Record `{ x, y, width, height }`.

4.  **Capture Design Tokens (`W3C DTCG Format`) & Interactive State Cleansing:**
    - Execute `window.getComputedStyle(el)`.
    - Extract core branded visual metadata (background-colors, fonts).
    - **Crucial Requirement:** Format output strictly to the **W3C Design Tokens Community Group** object structure (`{ "color": { "primary": { "$value": "#fff", "$type": "color" } } }`). This prevents translation steps and ensures Next.js/Tailwind configs can consume CSS variables natively in Phase 4.
    - Remove temporary state classes: Elements with `.active`, `.focus`, or `aria-current="page"` must be stripped out before logging data so the engine recognizes identical template headers across different pages.
    - Execute `window.getComputedStyle(el)`.
    - Extract minimal token hints: `{ backgroundColor, color, fontSize, fontFamily, padding, margin }`.
    - _Crucial for Hashing:_ Strip ephemeral state classes (like `.active`) and `aria-current` from the logged signature. This ensures the Header hashes identically across pages despite active menu states.

5.  **Capture Accessibility, Semantics & iFrames (The Secret Weapon):**
    - `el.tagName` (e.g., `NAV`, `SECTION`, `FORM`, `IFRAME`)
    - `el.getAttribute('role')`, `aria-label`, and `alt`.
    - _iFrame Handling:_ If `el.tagName === 'IFRAME'`, capture its `src` and `title`. Even though we cannot pierce Cross-Origin Shadow DOMs, the `src` URL tells the LLM "This is a HubSpot Form."

6.  **Output Structure:**
    - Serialize findings. The final returned payload should contain two roots:
      `{ seo: { title, description... }, nodes: [ { id, geometry, tags, html... } ] }`.

---

## Implementation Status

- [ ] Create `src/crawler/inject/dom-parser.js`.
- [ ] Implement SEO Metadata extractor (`<head>` tags).
- [ ] Implement DOM traversal & ignore rules (invisibles, SVG bloat).
- [ ] Implement geometry extraction `getBoundingClientRect()`.
- [ ] Implement style extraction `getComputedStyle()`.
- [ ] Implement accessibility/semantic attribute harvesting.

## Verification & Tests

**Test File:** `tests/dom_parser.test.js`

**Test Requirements:**

1. **SEO Extraction:** Inject the parser into a synthetic page with a `<title>` and `<meta name="description">`. Assert the returned `seo` object maps these perfectly.
2. **Geometry Mapping:** Inject the parser into a synthetic page with a `100x100` div positioned at `top: 50px`. Assert the parser outputs exact JSON matching those dimensions.
3. **Exclusion Validation:** Ensure hidden `<div style="display:none">` and `<script>` tags are utterly ignored by the walker algorithm.

**Execution:**
`npm run test tests/dom_parser.test.js`
