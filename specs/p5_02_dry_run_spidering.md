# Phase 5.2: Dry-Run Spidering (Discovery)

## Objective

To rapidly map the entire topology of the target site and populate the SQLite State Store without executing heavy Playwright captures or AI classifications.

## 1. Architectural Design

The spider utilizes the settings defined in `fotocopy.config.ts` (e.g., `sitemapUrl`, `staticUrlList`, `intakeCsvPath`) to aggregate all known endpoints. It performs lightweight `fetch` or Cheerio GET requests to validate the 200 OK status and logs them into the database.

## 2. Discovery Logic

```typescript
// packages/core/scripts/discovery/spider.ts

import { fotocopyConfig } from "../../../fotocopy.config";
import { db } from "../state_db";
import * as fs from "fs";

export async function runDiscovery() {
  const discoveredUrls = new Set<string>([...fotocopyConfig.staticUrlList]);

  // 1. Parse CSV if exists
  if (fs.existsSync(fotocopyConfig.intakeCsvPath)) {
    const csvContent = fs.readFileSync(fotocopyConfig.intakeCsvPath, "utf-8");
    // ... parse CSV and add to discoveredUrls
  }

  // 2. Fetch Sitemap
  if (fotocopyConfig.sitemapUrl) {
    const sitemapXml = await fetch(fotocopyConfig.sitemapUrl).then((res) =>
      res.text(),
    );
    // ... parse XML targeting <loc> nodes and add to discoveredUrls
  }

  // 3. Batch Insert to SQLite safely overlapping existing
  const insertStmt = db.prepare(`
    INSERT INTO url_queue (url, pathname, status) 
    VALUES (?, ?, 'DISCOVERED') 
    ON CONFLICT(url) DO NOTHING
  `);

  const insertMany = db.transaction((urls: string[]) => {
    for (const url of urls) {
      const pathname = new URL(url).pathname;
      insertStmt.run(url, pathname);
    }
  });

  insertMany(Array.from(discoveredUrls));
  console.log(`Discovery complete. Loaded ${discoveredUrls.size} URLs.`);
}
```

## 3. Extending the Crawler

Later phases (the Playwright crawler from Phase 1) will now be updated to select from URL queue:

```typescript
const batch = claimBatch("DISCOVERED", 5);
for (const record of batch) {
  // run Playwright
  // mark record as 'CRAWLED'
}
```

## 4. Testing & Regression Strategy

### Unit Tests (`spider.test.ts`)

- **Sitemap Mock:** Intercept `fetch` to `fotocopyConfig.sitemapUrl`. Return a mock `sitemap.xml` with 3 URLs. Assert exactly 3 rows are inserted into `url_queue`.
- **Deduplication Check:** Run the discover script twice without clearing the DB. Assert the row count remains identical (testing the `ON CONFLICT DO NOTHING` integrity).
