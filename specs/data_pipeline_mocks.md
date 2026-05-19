# Data Pipeline Mocks & Data Flow

This document outlines the exact data structures and JSON schemas as a legacy page moves through the 5-phase migration pipeline. The goal is to perfectly map how the output of Step $N$ acts as the input for Step $N+1$, culminating in a CMS-ready dataset.

## Step 1: Network Discovery & DOM Stamping

**Output of Playwright Crawler.** Every DOM element gets a strict `data-awa-id`. An offline copy of the HTML and its metadata is saved.

**File: `/data/capture/001_about_us/metadata.json`**

```json
{
  "url": "https://legacy-site.com/about",
  "route": "/about",
  "status": 200,
  "seo": {
    "title": "About Us | Legacy Co",
    "description": "We have been doing business since 1998."
  },
  "snapshot_file": "dom.html"
}
```

**File: `/data/capture/001_about_us/dom.html` (Fragment)**

```html
<body data-awa-id="0">
  <div id="header" data-awa-id="1">...</div>
  <div class="content" data-awa-id="45">
    <h1 data-awa-id="46">Our History</h1>
    <p data-awa-id="47">Founded in 1998...</p>
    <img src="/old-images/team.jpg" data-awa-id="48" />
  </div>
  <div id="footer" data-awa-id="99">...</div>
</body>
```

---

## Step 2: Global Intersection & Template Inference

**Output of offline tree analysis.** Compares all `dom.html` files to find repeating global structures and cluster URL schemes.

**File: `/data/analysis/globals_manifest.json`**

```json
{
  "global_exclusions": {
    "header_hashes": ["hash_1a2b", "hash_9f4d"],
    "footer_hashes": ["hash_7c8e"]
  },
  "template_clusters": [
    {
      "type": "collection",
      "name": "posts",
      "url_pattern": "^/blog/.+",
      "sample_urls": ["/blog/post-1", "/blog/post-2"]
    },
    {
      "type": "ad-hoc",
      "name": "pages"
    }
  ]
}
```

---

## Step 3: Subtraction & Slicing

**Output of the Chunk Slicer.** Removes nodes matching hashes from Step 2, then slices the remaining DOM down sibling boundaries (e.g., width shifts, background colors).

**File: `/data/chunks/001_about_us.json`**

```json
{
  "page_id": "001_about_us",
  "chunks": [
    {
      "chunk_index": 0,
      "bounds": { "start_awa_id": "46", "end_awa_id": "48" },
      "raw_html": "<h1 data-awa-id=\"46\">Our History</h1><p data-awa-id=\"47\">Founded in 1998...</p><img src=\"/old-images/team.jpg\" data-awa-id=\"48\" />"
    }
  ]
}
```

---

## Step 4: AI Classification (Ollama / Gemma)

**Output of the LLM.** The LLM receives the `raw_html` from Step 3 and a strictly enforced Zod schema. **Crucially, it ONLY returns `awa-ids` (Node Pointers) for strings, preventing hallucination.**

**File: `/data/llm_classifications/001_about_us.json`**

```json
{
  "page_id": "001_about_us",
  "blocks": [
    {
      "blockType": "ContentWithImage",
      "confidence": 0.98,
      "mappings": {
        "headingNodeId": "46",
        "textContentNodeId": "47",
        "imageNodeId": "48"
      }
    }
  ]
}
```

---

## Step 5: Hydration & CMS Handoff

**Output of the Node Orchestrator.** It takes the LLM's pointers (Step 4), looks up the exact strings/src attributes in the offline DOM (Step 1), and downloads specific assets to the local folder. This is the **final JSON** that seeds Payload CMS and Next.js.

**File: `/data/final_cms_seed/pages/about_us.json`**

```json
{
  "title": "About Us | Legacy Co",
  "slug": "about",
  "layout": [
    {
      "blockType": "ContentWithImage",
      "data": {
        "heading": "Our History",
        "content": "<p>Founded in 1998...</p>",
        "image": {
          "url": "/migrated-media/team.jpg",
          "alt": "Our team photo"
        }
      }
    }
  ]
}
```

### The resulting Next.js Catch-All Route (Phase 5 frontend):

```tsx
// app/[...slug]/page.tsx
import { ContentWithImage } from "@/components/blocks/ContentWithImage";

export default function DynamicPage({ layout }) {
  return (
    <main>
      {layout.map((block, i) => {
        if (block.blockType === "ContentWithImage") {
          return <ContentWithImage key={i} {...block.data} />;
        }
      })}
    </main>
  );
}
```
