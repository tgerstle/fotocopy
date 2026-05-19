import { describe, it, expect } from "vitest";
import { crawlAndCapture } from "../../scripts/crawler/capture";
import { DesignTokensSchema } from "../../schemas/tokens";
import * as path from "path";
import * as fs from "fs/promises";
import * as cheerio from "cheerio";
import { fotocopyConfig } from "../../../fotocopy.config";

// These are end-to-end tests relying on a real network request.
// We set a high timeout because Playwright has to boot Chromium and load the target site.
describe("Phase 1: Live Crawler Engine (Contract-Driven Testing)", () => {
  const outputDir = path.resolve(__dirname, "../../output/live_capture");
  const targetUrl = fotocopyConfig.testTargetUrl;

  // We run the crawler once before all tests so we don't hammer the site multiple times.
  let capturedHtml: string;
  let capturedTokens: any;

  it(
    "executes a defensive crawl against css-snacks.com",
    { timeout: 30000 }, // Generous timeout for Chromium to launch & load
    async () => {
      const result = await crawlAndCapture({ url: targetUrl, outputDir });
      capturedHtml = result.html;
      capturedTokens = result.tokens;

      // Basic assertions
      expect(capturedHtml).toBeTruthy();
      expect(capturedTokens).toBeTruthy();
    },
  );

  it("outputs a valid W3C Design Tokens JSON schema", () => {
    // Contract-Driven Test: The tokens extracted physically from CSS Snacks must perfectly pass our Zod rules form Phase 0
    expect(() => DesignTokensSchema.parse(capturedTokens)).not.toThrow();
  });

  it("successfully injects data-awa-id into the DOM before snapshotting", () => {
    const $ = cheerio.load(capturedHtml);

    // We expect the DOM parser to have traversed and injected the enumerator
    const elementsWithId = $("[data-awa-id]");
    expect(elementsWithId.length).toBeGreaterThan(10); // CSS Snacks should have plenty of elements

    // Check that ID 1 exists as a sanity check
    const firstElement = $('[data-awa-id="1"]');
    expect(firstElement.length).toBe(1);
  });
});
