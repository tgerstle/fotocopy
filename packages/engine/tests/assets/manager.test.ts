import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { downloadAssetsLocally } from "../../src/assets/manager";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

describe("Assets Manager", () => {
  let tempDir: string;
  let manifestsDir: string;
  let publicAssetsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "fotocopy-assets-test-"));
    manifestsDir = path.join(tempDir, "manifests");
    publicAssetsDir = path.join(tempDir, "publicAssets");
    await fs.mkdir(manifestsDir, { recursive: true });

    // Polyfill global fetch
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("404")) {
        return { ok: false };
      }
      if (url.includes("error")) {
        throw new Error("Network Error");
      }
      return {
        ok: true,
        arrayBuffer: async () => Buffer.from("fake-image-data"),
      };
    });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("handles missing target directory gracefully", async () => {
    // Should not throw, should just warn and return
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(
      downloadAssetsLocally(
        path.join(tempDir, "does-not-exist"),
        publicAssetsDir,
        "http://mock.com",
      ),
    ).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalled();
  });

  it("downloads images and rewrites local map paths", async () => {
    const mockJson = {
      image: "http://mock.com/hero.jpg",
      nested: {
        logo: "/logo.png",
      },
      notImage: "http://mock.com/something.pdf",
    };
    await fs.writeFile(
      path.join(manifestsDir, "data.json"),
      JSON.stringify(mockJson),
    );

    await downloadAssetsLocally(
      manifestsDir,
      publicAssetsDir,
      "http://mock.com",
    );

    const newJsonRaw = await fs.readFile(
      path.join(manifestsDir, "data.json"),
      "utf-8",
    );
    const newJson = JSON.parse(newJsonRaw);

    expect(newJson.image).toMatch(/^\/assets\/hero\.jpg/);
    expect(newJson.nested.logo).toMatch(/^\/assets\/logo\.png/);
    expect(newJson.notImage).toMatch(/^\/assets\/something\.pdf/);

    const files = await fs.readdir(publicAssetsDir);
    expect(files.length).toBeGreaterThan(0);
    expect(files).toContain("hero.jpg");
    expect(files).toContain("logo.png");
    expect(files).toContain("something.pdf");
  });

  it("gracefully handles bad network connections and 404s without crashing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const mockJson = {
      broken: "http://mock.com/404.jpg",
      err: "http://mock.com/error.jpg",
    };
    await fs.writeFile(
      path.join(manifestsDir, "bad.json"),
      JSON.stringify(mockJson),
    );

    await downloadAssetsLocally(
      manifestsDir,
      publicAssetsDir,
      "http://mock.com",
    );

    const newJsonRaw = await fs.readFile(
      path.join(manifestsDir, "bad.json"),
      "utf-8",
    );
    const newJson = JSON.parse(newJsonRaw);

    // Should remain untouched
    expect(newJson.broken).toBe("http://mock.com/404.jpg");
    expect(newJson.err).toBe("http://mock.com/error.jpg");
    expect(console.error).toHaveBeenCalled();
  });
});
