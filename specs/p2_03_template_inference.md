# Phase 2, Step 3: Collection & Template Inference

A CMS like a CMS should not consist of 10,000 "Ad-Hoc" pages. It needs structured data. A Blog Post should have a rigorous `title` and `author` field, distinct from a standard marketing page.

This engine automatically clusters legacy pages into CMS Collections.

## 1. URL Topology Clustering

The first signal is the URL route scheme.
If the crawler discovers 500 pages residing under `/news/2023/...`, the system clusters these URLs into a tentative "News" bin.

## 2. Structural Topology Validation

URL paths can be misleading. To mathematically prove these 500 pages belong to the same database Collection, we validate their box-model topology.

**The Comparison:**
After the Global Intersection (`p2_02`) strips the Header and Footer, the engine hashes the primary structure of the remaining `<body>`.

- E.g., `[H1] -> [IMG] -> [DIV children: 14] -> [AUTHOR-TAG]`
- If 480 of the 500 `/news/*` pages share this exact blueprint, they are instantly flagged as a unified template.

## 3. The Output Definition

Instead of sending these to the generic block pipeline, the system outputs mapping instructions. We update the configuration to route these specific URLs (via Regex) to a `Posts` Collection in a CMS, utilizing a strictly defined `PostTemplate` rather than a generic array of blocks.

## Implementation Status

- [x] Create URL Topology prefix grouping (`/news/2026/hello` -> `/news`).
- [x] Create inner body DOM geometry validation (`template_inference.ts`).
- [x] Build clustering array map validating >= N matching inner instances.

## Verification & Tests

- [x] **Clustering Pass:** Tested with Vitest (`tests/intersection/03_template_inference.test.ts`), dynamically binning identical underlying geometries while dropping ad-hoc layouts that accidentally share identical URL prefixes.
