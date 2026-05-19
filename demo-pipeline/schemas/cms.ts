import { z } from "zod";
import { DesignTokensSchema } from "./tokens";

export const HeroBlockDataSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  backgroundImage: z.string().url().or(z.string().startsWith("/")),
  designTokens: DesignTokensSchema.optional(),
});

export const CMSBlockSchema = z.object({
  blockType: z.literal("Hero"),
  data: HeroBlockDataSchema,
});

export const CMSPageSchema = z.object({
  title: z.string(),
  slug: z.string(),
  collectionName: z.string().optional(),
  layout: z.array(CMSBlockSchema),
});

export type CMSPageData = z.infer<typeof CMSPageSchema>;
