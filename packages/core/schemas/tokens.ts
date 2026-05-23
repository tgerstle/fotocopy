import { z } from "zod";

const W3CTokenSchema = z.object({
  $value: z.string(),
  $type: z.string(),
});

const TokenGroupSchema = z.record(W3CTokenSchema);

export const DesignTokensSchema = z.object({
  color: TokenGroupSchema.optional(),
  fontFamily: TokenGroupSchema.optional(),
});
