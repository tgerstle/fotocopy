import { z } from "zod";

export const ConfigSchema = z.object({
  testTargetUrl: z.string().url().optional(),
  staticUrlList: z.array(z.string().url()).optional(),
  sitemapUrl: z.string().url().optional(),
  intakeCsvPath: z.string().optional(),
  outputDir: z.string().optional(),
  llm: z
    .object({
      model: z.string(),
      endpoint: z.string().url(),
      temperature: z.number().min(0).max(2).optional(),
      autoGenerateComponents: z.boolean().optional(),
    })
    .optional(),
  plugins: z
    .array(
      z.object({
        matcher: z.string(),
        tag: z.string(),
      }),
    )
    .optional(),
  maxSubpages: z.number().optional().default(0),
  crawlerConcurrency: z.number().optional().default(1),
  chunkSize: z.number().optional().default(500),
  overlapSize: z.number().optional().default(50),
});

export type FotocopyConfig = z.infer<typeof ConfigSchema>;

let currentConfig: Partial<FotocopyConfig> = {};

export function setConfig(config: unknown) {
  // Validate and store the configuration
  currentConfig = ConfigSchema.parse(config);
}

export function getConfig(): Partial<FotocopyConfig> {
  return currentConfig;
}
