import { describe, it, expect, vi, afterEach } from "vitest";
import { crawlAndCapture } from "../../src/crawler/capture";
import * as playwright from "playwright";

describe("Crawl and Capture Error Bounds", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("closes the browser properly when navigation timeouts occur", async () => {
    const mockClose = vi.fn();
    const mockGoto = vi.fn().mockRejectedValue(new Error("Timeout Exceeded"));

    vi.spyOn(playwright.chromium, "launch").mockResolvedValue({
      newContext: vi.fn().mockResolvedValue({
        newPage: vi.fn().mockResolvedValue({
          goto: mockGoto,
        }),
      }),
      close: mockClose,
    } as any);

    await expect(
      crawlAndCapture({ url: "http://mock.com/timeout", outputDir: "/tmp" }),
    ).rejects.toThrow("Timeout Exceeded");

    expect(mockClose).toHaveBeenCalled();
  });

  it("closes the browser properly when evaluate throws an error", async () => {
    const mockClose = vi.fn();
    const mockGoto = vi.fn().mockResolvedValue(null);
    const mockLocator = vi
      .fn()
      .mockReturnValue({ isVisible: vi.fn().mockResolvedValue(false) });
    const mockEvaluate = vi.fn().mockRejectedValue(new Error("JS Error"));

    vi.spyOn(playwright.chromium, "launch").mockResolvedValue({
      newContext: vi.fn().mockResolvedValue({
        newPage: vi.fn().mockResolvedValue({
          goto: mockGoto,
          locator: mockLocator,
          evaluate: mockEvaluate,
        }),
      }),
      close: mockClose,
    } as any);

    await expect(
      crawlAndCapture({ url: "http://mock.com/evalerror", outputDir: "/tmp" }),
    ).rejects.toThrow("JS Error");

    expect(mockClose).toHaveBeenCalled();
  });
});
