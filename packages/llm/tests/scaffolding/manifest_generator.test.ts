import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateManifests } from "../../src/scaffolding/manifest_generator";
import * as fs from "fs/promises";
import * as hydrator from "../../src/scaffolding/hydrator";

vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
  readdir: vi.fn(),
  mkdir: vi.fn(),
  writeFile: vi.fn(),
  access: vi.fn(),
  unlink: vi.fn(),
}));

describe("Manifest Generator", () => {
  const mockHydrate = vi.spyOn(hydrator, "hydrate");

  beforeEach(() => {
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.unlink).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("skips chunks without DOM files", async () => {
    vi.mocked(fs.readdir).mockResolvedValueOnce(["page/chunk1.json"] as any);
    vi.mocked(fs.readFile).mockResolvedValueOnce(
      JSON.stringify({ layout: [{ inferredBlockType: "Hero" }] }),
    );

    // Simulate DOM not existing
    vi.mocked(fs.access).mockRejectedValue(new Error("Cannot access"));

    await generateManifests("chunks", "map.json", "live", "out");

    expect(mockHydrate).not.toHaveBeenCalled();
    expect(vi.mocked(fs.writeFile)).not.toHaveBeenCalled();
  });

  it("hydrates when DOM is found and writes output manifest", async () => {
    vi.mocked(fs.readdir).mockResolvedValueOnce(["page/chunk1.json"] as any);
    vi.mocked(fs.readFile).mockResolvedValueOnce(
      JSON.stringify({ layout: [{ inferredBlockType: "Hero" }] }),
    );

    // Simulate DOM exists
    vi.mocked(fs.access).mockResolvedValue(undefined);
    mockHydrate.mockResolvedValueOnce({ success: true } as any);

    await generateManifests("chunks", "map.json", "live", "out");

    // Temp file gets written then unlinked
    expect(vi.mocked(fs.writeFile)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(fs.unlink)).toHaveBeenCalled();

    expect(mockHydrate).toHaveBeenCalled();
  });

  it("ignores errors during hydration but executes finally block", async () => {
    vi.mocked(fs.readdir).mockResolvedValueOnce(["page/chunk1.json"] as any);
    vi.mocked(fs.readFile).mockResolvedValueOnce(
      JSON.stringify({ layout: [{ inferredBlockType: "Hero" }] }),
    );

    // Simulate DOM exists
    vi.mocked(fs.access).mockResolvedValue(undefined);

    // Force hydrate failure
    mockHydrate.mockRejectedValueOnce(new Error("Hydrate error"));

    await generateManifests("chunks", "map.json", "live", "out");

    // the final manifest shouldn't be written but the temp file is written and unlinked
    expect(vi.mocked(fs.writeFile)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fs.unlink)).toHaveBeenCalled();
  });
});
