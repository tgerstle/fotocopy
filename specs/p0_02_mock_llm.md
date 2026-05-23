# Phase 0, Step 2: Mock LLM Classification

This spec validates the shape of the required output from Gemma (Phase 4). Crucially, the LLM is explicitly forbidden from generating the actual content (text/images) to prevent hallucinations. Instead, it generates strict JSON pointers.

## 1. The Mock File Structure

Create `/packages/core/mock_llm/02_llm_output.json`.

```json
{
  "page_id": "home_page",
  "blocks": [
    {
      "blockType": "Hero",
      "confidence": 0.99,
      "mappings": {
        "titleNodeId": "102",
        "subtitleNodeId": "103",
        "backgroundImageNodeId": "104"
      }
    }
  ]
}
```

## 2. Validation & Tests

This step strictly defines the Zod schema that the future orchestration engine will use to validate the LLM's response.

**Implementation (`/packages/core/schemas/llm.ts`):**

```typescript
import { z } from "zod";

export const LLMBlockSchema = z.object({
  blockType: z.string(),
  confidence: z.number().min(0).max(1),
  mappings: z.record(z.string(), z.string()), // Key is prop name, Value is data-awa-id string
});

export const LLMPageSchema = z.object({
  page_id: z.string(),
  blocks: z.array(LLMBlockSchema),
});
```

**Verification:**
We write a lightweight Vitest script (`test/llm_mock.test.ts`) that verifies our `02_llm_output.json` perfectly satisfies the `LLMPageSchema`. If the LLM ever returns raw strings instead of pointers, this schema must reject it.
