import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { processChunks } from "../../src/llm/batch_classifier";
import * as fs from "fs/promises";
import * as path from "path";
import * as ollama_client from "../../src/llm/ollama_client";

vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
  readdir: vi.fn(),
  mkdir: vi.fn(),
  writeFile: vi.fn(),
}));

describe("Batch Classifier (processChunks)", () => {
  const mockClassifyChunk = vi.spyOn(ollama_client, "classifyChunk");

  beforeEach(() => {
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("processes json chunks ignoring globals and writes output", async () => {
    vi.mocked(fs.readdir).mockResolvedValueOnce([
      "chunk1.json",
      "chunk2.json",
      "globals.json",
    ] as any);

    vi.mocked(fs.readFile).mockResolvedValueOnce(
      JSON.stringify({ markup: "<div>1</div>" }),
    );
    vi.mocked(fs.readFile).mockResolvedValueOnce(
      JSON.stringify({ nodes: [{ id: 1 }] }),
    );

    mockClassifyChunk.mockResolvedValueOnce({
      inferredBlockType: "Hero",
      mappings: {},
    });
    mockClassifyChunk.mockResolvedValueOnce({
      inferredBlockType: "Footer",
      mappings: {},
    });

    const results = await processChunks("chunks", "out/manifest.json", 2);

    expect(results).toHaveLength(2);
    expect(results[0].inferredBlockType).toBe("Hero");
    expect(results[1].inferredBlockType).toBe("Footer");

    expect(vi.mocked(fs.writeFile)).toHaveBeenCalledWith(
      "out/manifest.json",
      expect.stringContaining("Hero"),
    );
  });

  it("handles errors gracefully and returns Unknown block type", async () => {
    vi.mocked(fs.readdir).mockResolvedValueOnce(["chunk1.json"] as any);
    vi.mocked(fs.readFile).mockResolvedValueOnce(
      JSON.stringify({ markup: "<div>err</div>" }),
    );

    // Simulate classification failure
    mockClassifyChunk.mockRejectedValueOnce(new Error("Network Error"));

    const results = await processChunks("chunks", "out/manifest.json");

    expect(results).toHaveLength(1);
    expect(results[0].inferredBlockType).toBe("Unknown");
  });
});
