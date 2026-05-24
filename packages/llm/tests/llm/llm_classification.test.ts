import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import { classifyChunk } from "../../src/llm/ollama_client";

describe("LLM Classification Client (Ollama)", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("formats payload with json schema and parses correctly", async () => {
    const ComponentSchema = z.object({
      target: z.enum(["RichText", "Hero"]),
      nodeId: z.string(),
    });

    const mockResponseJSON = JSON.stringify({
      target: "RichText",
      nodeId: "node-456",
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ response: mockResponseJSON }),
    });

    const htmlChunk = `<div data-awa-id="node-456"><h2>Welcome</h2><p>Acme corp</p></div>`;

    const result = await classifyChunk(htmlChunk, ComponentSchema);

    expect(result).toEqual({
      target: "RichText",
      nodeId: "node-456",
    });

    // Check that fetch was called correctly
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fetchArgs = mockFetch.mock.calls[0];
    expect(fetchArgs[0]).toBe("http://localhost:11434/api/generate");

    const fetchOpts = fetchArgs[1];
    expect(fetchOpts.method).toBe("POST");

    const body = JSON.parse(fetchOpts.body);
    expect(body.prompt).toContain(htmlChunk);
    expect(body.format.type).toBe("object");
    expect(body.format.properties.target).toBeDefined();
    expect(body.format.properties.nodeId).toBeDefined();
  });

  it("throws an error if the LLM JSON response is malformed", async () => {
    const ComponentSchema = z.object({
      target: z.enum(["RichText"]),
      nodeId: z.string(),
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ response: '{"broken json' }), // Malformed JSON
    });

    await expect(classifyChunk("<div></div>", ComponentSchema)).rejects.toThrow(
      /Failed to parse LLM JSON response/,
    );
  });

  it("throws an error if Zod validation fails", async () => {
    const ComponentSchema = z.object({
      target: z.enum(["RichText"]),
      nodeId: z.string(),
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        response: JSON.stringify({ target: "INVALID", nodeId: "123" }),
      }),
    });

    await expect(classifyChunk("<div></div>", ComponentSchema)).rejects.toThrow(
      /Classification failed after/,
    );
  });

  it("heals hallucinated string strings via regex trimming", async () => {
    const ComponentSchema = z.object({
      target: z.string(),
      mappings: z.record(z.string(), z.string()),
    });

    const mockResponseJSON = JSON.stringify({
      target: "RichText",
      mappings: {
        title: "123_content_content",
        subtitle: ",456,",
      },
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ response: mockResponseJSON }),
    });

    const result = await classifyChunk("<div></div>", ComponentSchema);
    expect(result.mappings.title).toBe("123");
    expect(result.mappings.subtitle).toBe("456");
  });

  it("throws generic Ollama API Error if response is not ok", async () => {
    const ComponentSchema = z.object({ target: z.string() });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    await expect(classifyChunk("text", ComponentSchema)).rejects.toThrow(
      "Ollama API Error: 404 Not Found",
    );
  });
});
