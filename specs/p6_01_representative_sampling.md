# Phase 6.1: Representative Sampling & Bulk Cheerio Extraction

## Objective

To bypass processing redundant layouts through the LLM. We will group pages by DOM structure, classify the schema _once_ via the LLM using a Representative URL, and apply standard Cheerio parsing to extract data from the rest of the cluster.

## 1. Architectural Design

Once URLs are hashed in Phase 2, we update the `url_queue` with a `cluster_id` (a hash of the structural geometry). If `cluster_id_123` has 1,000 URLs, we select the first one. The LLM dictates not only the JSON data structure but _also the CSS selector paths_ required to get that data.

## 2. LLM Selector Mapping & Bulk Process

### The LLM Architect Output

The LLM is prompted to return a schema map alongside the data for the Representative URL.

```json
{
  "collection": "Products",
  "selectors": {
    "title": "h1.product-headline",
    "price": "div.pricing-block > span.amount",
    "description": "div.prose.product-desc"
  }
}
```

### The Cheerio Bulk Extractor

```typescript
// packages/core/scripts/scaffolding/bulk_extractor.ts
import * as cheerio from "cheerio";
import { db } from "../state_db";

interface SelectorMap {
  [key: string]: string;
}

export function bulkExtractCluster(clusterId: string, selectors: SelectorMap) {
  // Get all remaining URLs for this specific cluster structure
  const urls = db
    .prepare(
      `SELECT * FROM url_queue WHERE cluster_id = ? AND status = 'CRAWLED'`,
    )
    .all(clusterId);

  for (const record of urls) {
    const rawHtml = loadSavedHtml(record.pathname); // From Phase 1 snapshot
    const $ = cheerio.load(rawHtml);
    const extractedData: Record<string, string> = {};

    for (const [field, selector] of Object.entries(selectors)) {
      extractedData[field] = $(selector).text().trim();
    }

    // Save generated fast JSON Payload
    saveManifest(record.pathname, extractedData);

    // Update local status
    db.prepare(`UPDATE url_queue SET status = 'HYDRATED' WHERE id = ?`).run(
      record.id,
    );
  }
}
```

## 3. Testing & Regression Strategy

### Contract-Driven Tests (`bulk_extractor.test.ts`)

- **Deterministic Ripping:** Provide 3 static HTML fixture files with identical markup but differing text (e.g., Apple, Banana, Orange products).
- Pass a static `SelectorMap` to `bulkExtractCluster`.
- **Assertion:** Verify that the outputted JSON manifests perfectly align with the text of the 3 fixtures. This ensures the structural assumption holds 100% of the time, guaranteeing zero data loss.
