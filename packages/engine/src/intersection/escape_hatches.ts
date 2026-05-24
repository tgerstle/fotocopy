import * as cheerio from "cheerio";
import { getConfig } from "../config";

export interface EscapeHatchMatch {
  tag: string;
  reason?: string;
  originalNodeId?: string;
}

/**
 * Checks an HTML string against configured plugins/escape hatches.
 * Bypasses LLM clustering if it matches.
 */
export function detectEscapeHatches(html: string): EscapeHatchMatch | null {
  const config = getConfig();
  const plugins = config.plugins;

  if (!plugins || plugins.length === 0) {
    return null; // No plugins configured
  }

  const $ = cheerio.load(html);

  for (const plugin of plugins) {
    const $matched = $(plugin.matcher);
    if ($matched.length > 0) {
      // Find the first matched element's ID or construct a pseudo-id
      const id =
        $matched.first().attr("id") ||
        `matched-${plugin.matcher.replace(/[^a-zA-Z0-9]/g, "-")}`;

      return {
        tag: plugin.tag,
        reason: `Matched plugin constraint: ${plugin.matcher}`,
        originalNodeId: id,
      };
    }
  }

  // Check for canvas or webgl automatically as a general escape hatch fallback
  if ($("canvas").length > 0) {
    return {
      tag: "MANUAL_INTERVENTION",
      reason: "Contains generic complex WebGL/Canvas interaction",
      originalNodeId: $("canvas").first().attr("id") || "canvas-unknown",
    };
  }

  return null;
}
