import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateCode } from "../../src/llm/ollama_client";

describe("LLM Code Generator (generateCode timeout guards)", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("handles standard streaming response and extracts markdown code blocks", async () => {
    const mockReads = [
      {
        done: false,
        value: new TextEncoder().encode('{"response":"```tsx\\nexport"}'),
      },
      {
        done: false,
        value: new TextEncoder().encode('{"response":" default function()"}'),
      },
      {
        done: false,
        value: new TextEncoder().encode('{"response":" {}\\n```"}'),
      },
      { done: true },
    ];

    let readIndex = 0;
    mockFetch.mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: vi.fn().mockImplementation(() => {
            return Promise.resolve(mockReads[readIndex++]);
          }),
        }),
      },
    });

    const result = await generateCode("make me a component");
    expect(result.component).toBe("export default function() {}");
    expect(result.story).toBeUndefined();
  });

  it("extracts component and story when two code blocks are present", async () => {
    const mockReads = [
      {
        done: false,
        value: new TextEncoder().encode(
          '{"response":"```tsx\\nhello\\n```\\n```ts\\nstory\\n```"}',
        ),
      },
      { done: true },
    ];

    let readIndex = 0;
    mockFetch.mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: vi.fn().mockImplementation(() => {
            return Promise.resolve(mockReads[readIndex++]);
          }),
        }),
      },
    });

    const result = await generateCode("make me a component");
    expect(result.component).toBe("hello");
    expect(result.story).toBe("story");
  });

  it("falls back to full response if no markdown block is found", async () => {
    const mockReads = [
      {
        done: false,
        value: new TextEncoder().encode(
          '{"response":"No markdown here just text"}',
        ),
      },
      { done: true },
    ];

    let readIndex = 0;
    mockFetch.mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: vi.fn().mockImplementation(() => {
            return Promise.resolve(mockReads[readIndex++]);
          }),
        }),
      },
    });

    const result = await generateCode("test");
    expect(result.component).toBe("No markdown here just text");
  });

  it("throws error for non-ok API responses", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(generateCode("test")).rejects.toThrow(
      "Ollama API Error: 500 Internal Server Error",
    );
  });

  it("throws after max attempts on streaming failure", async () => {
    // Failing stream continuously
    mockFetch.mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: vi
            .fn()
            .mockRejectedValue(new Error("Stream aborted unexpectedly")),
        }),
      },
    });

    await expect(generateCode("test")).rejects.toThrow(
      "Stream aborted unexpectedly",
    );
    expect(mockFetch).toHaveBeenCalledTimes(2); // Retries max 2 attempts
  });
});
