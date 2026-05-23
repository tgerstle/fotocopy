import { test, expect, vi } from "vitest";
import { runDiscovery } from "@fotocopy/engine";
import { processChunks } from "@fotocopy/llm";

vi.mock("@fotocopy/engine", () => ({
  runDiscovery: vi.fn().mockResolvedValue([]),
  crawlAndCapture: vi.fn(),
  computeGlobalIntersections: vi.fn(),
  purgeAndSlicePage: vi.fn(),
  extractTokens: vi.fn(),
  getConfig: vi.fn().mockReturnValue({}),
  setConfig: vi.fn()
}));

vi.mock("@fotocopy/llm", () => ({
  processChunks: vi.fn(),
  classifyGlobals: vi.fn(),
  hydrate: vi.fn(),
  consolidateComponents: vi.fn(),
  extractSampleData: vi.fn(),
  generatePrompts: vi.fn(),
  generateGlobalPrompts: vi.fn(),
  extractSandboxTemplate: vi.fn(),
  injectTokensToCSS: vi.fn()
}));

test("CLI orchestration correctly mocks dependencies", async () => {
  // This verifies that the dependencies can be mocked correctly
  // without calling real browser/ollama logic.
  expect(vi.isMockFunction(runDiscovery)).toBe(true);
  expect(vi.isMockFunction(processChunks)).toBe(true);
});
