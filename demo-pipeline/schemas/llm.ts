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
