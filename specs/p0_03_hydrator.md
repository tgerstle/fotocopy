# Phase 0, Step 3: Hydration Engine

This spec proves the linchpin of our architecture: combining the LLM pointers with the raw offline DOM to extract 100% accurate, hallucination-free data.

## 1. The Hydrator Script (`hydrator.js`)

**Goal:** Read LLM outputs, query the raw DOM, and generate the final payload-ready JSON.

**Implementation (`/packages/core/scripts/hydrator.js`):**

1. Read `mock_llm/02_llm_output.json`.
2. Read and parse `mock_capture/01_raw_dom.html` (using `cheerio` or `jsdom`).
3. For every block in the LLM output, look at the `mappings`.
4. If `mappings.titleNodeId === "102"`, the script queries `[data-awa-id="102"]`.
5. It extracts `.text()` (or `.attr('src')` for images).
6. It writes the combined data to `/packages/core/output/03_cms_ready.json`.

### Expected Output (`03_cms_ready.json`)

```json
{
  "title": "Home Page",
  "slug": "index",
  "layout": [
    {
      "blockType": "Hero",
      "data": {
        "title": "Welcome to Fotocopy",
        "subtitle": "We migrate websites.",
        "backgroundImage": "/old-assets/hero.jpg",
        "designTokens": {
          "color": {
            "primary": { "$value": "#E24A4A", "$type": "color" }
          }
        }
      }
    }
  ]
}
```

### Zod Schema (`/packages/core/schemas/cms.ts`)

To ensure the hydrator guarantees output perfectly matching the future CMS types, we define the final interface. By keeping this schema central, we can export `CMSPageData` directly to the `BlockRenderer` React component later.

```typescript
import { z } from "zod";

// For every block Type, we have a strict data shape definition.
export const HeroBlockDataSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  backgroundImage: z.string().url().or(z.string().startsWith("/")),
});

export const CMSBlockSchema = z.object({
  blockType: z.literal("Hero"), // Extensible via union: z.union([z.literal("Hero"), z.literal("Text")])
  data: HeroBlockDataSchema,
});

export const CMSPageSchema = z.object({
  title: z.string(),
  slug: z.string(),
  collectionName: z.string().optional(), // Phase 2 Injection  layout: z.array(CMSBlockSchema),
});

export type CMSPageData = z.infer<typeof CMSPageSchema>;
```

## 2. Verification & Tests (`test/hydrator.test.ts`)

We prove the hydrator works through automated tests:

- **Test 1 (Exact Match):** The output `title` strictly equals "Welcome to Fotocopy".
- **Test 2 (Missing Node):** What happens if the LLM hallucinated an ID (e.g., `999`)? The hydrator should gracefully fall back to `null` or emit a warning log, ensuring the script does not crash.
- **Test 3 (Attribute extraction):** If the schema expects an image, the query extracts the `src` attribute, not the inner text.
