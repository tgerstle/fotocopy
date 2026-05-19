# Phase 0, Step 1: Mock Capture & Tokens

This spec validates the output of what Playwright _would_ do in Phase 1 (Crawling). It establishes the structure for the stamped offline DOM and the extracted CSS design tokens.

## 1. The Mock File Structures

Create a `/demo-pipeline/mock_capture` directory.

### `01_globals_manifest.json` (Phase 2 Simulation)

This mock simulates the output of the Global Intersection hashing engine. It tells the pipeline which node hashes to ignore (pretending they belong to a global layout like a navbar).

```json
{
  "header_hashes": ["hash-abc123navbar"],
  "footer_hashes": ["hash-xyz987footer"]
}
```

### `01_raw_dom.html`

This represents a chunk of the legacy DOM after Playwright has forcefully injected `data-awa-id` attributes onto every text and image node.

```html
<div class="legacy-hero" data-awa-id="101">
  <h1 data-awa-id="102">Welcome to Fotocopy</h1>
  <p data-awa-id="103">We migrate websites.</p>
  <img src="/old-assets/hero.jpg" data-awa-id="104" />
</div>
```

### `01_design_tokens.json`

This represents the CSS styles (`getComputedStyle`) Playwright scraped from the `<body>` and root `:root` vars.

```json
{
  "colors": {
    "primary": { "$value": "#E24A4A", "$type": "color" },
    "background": { "$value": "#FFFFFF", "$type": "color" },
    "text": { "$value": "#333333", "$type": "color" }
  },
  "fontFamily": {
    "sans": { "$value": "Inter, sans-serif", "$type": "fontFamily" }
  }
}
```

### Zod Schema (`/demo-pipeline/schemas/tokens.ts`)

To strictly validate the incoming tokens before generating Tailwind configs, we enforce a Zod schema validating the widespread W3C format:

```typescript
import { z } from "zod";

const SharedToken = z.object({
  $value: z.string(),
  $type: z.string(),
});

export const DesignTokenSchema = z.record(
  z.string(),
  z.record(z.string(), SharedToken),
);
export type DesignTokens = z.infer<typeof DesignTokenSchema>;
```

## 2. Token Sync Script (`sync-tokens.js`)

**Goal:** Prove that extracted legacy design tokens can automatically configure the new Next.js front-end.

**Implementation (`/demo-pipeline/scripts/sync-tokens.js`):**
A Node script that reads `01_design_tokens.json` and programmatically generates/updates a `tailwind.config.js` or a global `globals.css` (with CSS Variables) in the Next.js target directory.

**Verification (Test):**

1. Run `node sync-tokens.js`.
2. Inspect the generated CSS/Tailwind config to ensure `text-primary` maps to `#E24A4A`.
3. If we update `01_design_tokens.json` to `#0000FF` and re-run, the Tailwind theme updates.
