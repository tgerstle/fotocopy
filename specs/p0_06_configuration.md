# Phase 0, Step 6: Configuration & Hook System

To ensure our migration engine is abstract and reusable, we must prevent site-specific logic from leaking into our core extraction scripts. To do this, we introduce the `fotocopy.config.ts` pattern.

This spec proves that our data pipeline can be intercepted and modified by a user-defined configuration file.

## 1. The Configuration Schema & File

Create `/demo-pipeline/schemas/config.ts`:

```typescript
import { z } from "zod";

export const FotocopyConfigSchema = z.object({
  llm: z.object({
    endpoint: z.string().url(),
    model: z.string(),
    systemPromptInjection: z.string().optional(),
  }),
  routing: z.array(
    z.object({
      pattern: z.string(), // Regex string
      type: z.enum(["collection", "ad-hoc"]),
      collectionName: z.string().optional(),
    }),
  ),
  hooks: z
    .object({
      beforeHydrate: z.function().args(z.any()).returns(z.any()).optional(),
    })
    .optional(),
});

export type FotocopyConfig = z.infer<typeof FotocopyConfigSchema>;
```

Create exactly what a user would define in `/demo-pipeline/fotocopy.config.ts`:

```typescript
import { FotocopyConfig } from "./schemas/config";

export default {
  llm: {
    endpoint: "http://localhost:11434/api/generate",
    model: "gemma4:e4b",
    systemPromptInjection:
      "Pay special attention to legacy 'table' layouts, they are actually grids.",
  },
  routing: [
    { pattern: "^/blog/.*", type: "collection", collectionName: "posts" },
  ],
  hooks: {
    // Example Hook: A user wants to ensure all headers have a specific class added
    // before the hydrator runs.
    beforeHydrate: (llmPointers) => {
      console.log("Hook intercepted LLM pointers!");
      return llmPointers;
    },
  },
} satisfies FotocopyConfig;
```

## 2. Integration into the Hydrator (Phase 0 Simulation)

We update `hydrator.js` (from `p0_03`) so that its very first action is importing `fotocopy.config.ts`.

1.  **Test 1 (Routing):** The hydrator checks the URL of the current chunk (e.g., `/blog/my-post`) against the `config.routing` regex. If it matches, the hydrator outputs `collection: 'posts'` into the final `cms_ready.json`, instead of a generic page.
2.  **Test 2 (Hooks):** The hydrator wraps its core logic:
    ```javascript
    let data = readLLMOutput();
    if (config.hooks?.beforeHydrate) {
      data = config.hooks.beforeHydrate(data);
    }
    // ... run standard hydration logic
    ```

## Verification & Tests (`tests/tracer/06_config.test.ts`)

We prove the config file intercepts the data pipeline.

1. We run the `hydrator.js` test.
2. We assert that the LLM endpoint string read by the engine matches the local config file.
3. We assert that `beforeHydrate` was fired when executing the mock, proving the plugin architecture works for later Phase 1 components to hook into.
