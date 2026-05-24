import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { classifyGlobals } from "../../src/llm/globals_classifier";
import * as fs from "fs/promises";
import * as ollama_client from "../../src/llm/ollama_client";
import { PipelineError } from "@fotocopy/engine";

vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
  mkdir: vi.fn(),
  writeFile: vi.fn(),
}));

describe("Phase 1: classifyGlobals", () => {
  const mockClassifyChunk = vi.spyOn(ollama_client, "classifyChunk");

  beforeEach(() => {
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns early if elementsToRemove is empty", async () => {
    vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify({}));
    const results = await classifyGlobals("manifest.json", "output.json");
    expect(results).toEqual({});
    expect(mockClassifyChunk).not.toHaveBeenCalled();
  });

  it("classifies a list of elements based on their preview string", async () => {
    vi.mocked(fs.readFile).mockResolvedValueOnce(
      JSON.stringify({
        elementsToRemove: {
          hash123: "<div>nav</div>",
          hash456: ["<footer>", "</footer>"],
        },
      }),
    );

    mockClassifyChunk.mockResolvedValueOnce({ inferredBlockType: "SiteNav" });
    mockClassifyChunk.mockResolvedValueOnce({ inferredBlockType: "AppFooter" });

    const results = await classifyGlobals("manifest.json", "out/test.json");

    expect(mockClassifyChunk).toHaveBeenCalledTimes(2);
    expect(results["hash123"]).toEqual({ inferredBlockType: "SiteNav" });
    expect(results["hash456"]).toEqual({ inferredBlockType: "AppFooter" });

    expect(vi.mocked(fs.writeFile)).toHaveBeenCalledWith(
      "out/test.json",
      expect.stringContaining("SiteNav"),
    );
  });

  it("gracefully catches errors and pushes them to the error array", async () => {
    vi.mocked(fs.readFile).mockResolvedValueOnce(
      JSON.stringify({
        elementsToRemove: {
          badHash: "<div>broken</div>",
        },
      }),
    );

    mockClassifyChunk.mockRejectedValueOnce(new Error("Ollama Timeout"));

    const errors: PipelineError[] = [];
    const results = await classifyGlobals(
      "manifest.json",
      "out/test.json",
      2,
      errors,
    );

    expect(results["badHash"]).toBeUndefined();
    expect(errors.length).toBe(1);
    expect(errors[0].phase).toBe("GLOBAL_CLASSIFY");
    expect(errors[0].error).toBe("Ollama Timeout");
  });
});
