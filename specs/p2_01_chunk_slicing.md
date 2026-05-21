# Phase 2, Step 1: Chunk Slicing (`src/processor/chomper.js`)

**Goal:** Break vertically scrolling stripped pages into horizontal component isolation chunks (e.g., Hero, Body Features, CTA) without breaking inner elements. This serves as Phase 2, Step 1.

## Architectural Decisions

Relying solely on "100% viewport width" to identify component boundaries fails dramatically on "Boxed" websites where the entire `body` or `main` tag is constrained by a `max-width` (e.g. `1200px`) wrapper. Thus, we update the Sibling Boundary Rule to rely on contextual parent geometry and design shifts.

## Execution Flow

1. **Input Payload:**
   - Receives the stripped JSON array mapping (after Global Headers/Footers have been subtracted).
2. **The Updated Sibling Boundary Logic:**
   Iterate over the topmost available sibling elements and define a slice boundary if ANY of the following are true:
   - **Width Inheritance:** The child element's width is >= 95% of its _immediate parent's_ width (not the viewport).
   - **Background Shift:** The `getComputedStyle` `background-color` differs significantly from its preceding sibling (e.g., a white text section followed by a dark blue CTA section).
   - **Margin Gulfs:** The element has an extraordinarily large `margin-top`, acting as a visual delimiter.
   - **Semantic Delimiters:** The element is an `<hr>`, `<section>`, or `<article>`.
   - **Sticky/Absolute Bypass:** Elements with CSS `position` of `sticky`, `fixed`, or `absolute` are strictly ignored as boundaries to prevent floating side-navs or widgets from maliciously slicing hierarchical document flow.
3. **Array Chunker:**
   - Group the sequential DOM nodes into logical "Chunks" based on these boundary delimiters.
4. **Output Structure:**
   - Write to `data/sliced_chunks/{route}/` as sequential chunk files (e.g., `chunk_01.json`, `chunk_02.json`). These are cleanly isolated to be handed to the LLM.

---

## Implementation Status

- [x] Create `src/processor/chomper.js` (Implemented as `chunk_slicer.ts`).
- [x] Implement Parent Width boundary logic.
- [x] Implement Background Color shift logic.
- [x] Implement array grouping algorithm.
- [x] Implement CSS Position bypass logic for floating widgets.

## Verification & Tests

**Test File:** `tests/intersection/02_chunk_slicing.test.ts`

**Test Requirements:**

- [x] **Boxed Layout Pass:** Feed synthetic JSON representing a strict `1000px` boxed layout containing 3 vertical sections. Assert the algorithm creates 3 separate chunks.
- [x] **Color Shift Pass:** Feed synthetic JSON of 4 divs where the third div changes background color to `#000000`. Assert the algorithm slices at the 3rd div.
- [x] **Sticky/Absolute Bypass Pass:** Feed synthetic JSON containing overlapping coordinates with a `sticky` position. Assert it merges into the parent rather than breaking the sequence incorrectly.
