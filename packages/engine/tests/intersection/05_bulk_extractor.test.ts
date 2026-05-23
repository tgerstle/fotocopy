import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  bulkExtractCluster,
  SelectorMap,
} from "../../src/intersection/bulk_extractor";
import { db, initializeDatabase } from "../../src/state_db";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Fix for __dirname in Vitest
const mockDir = path.resolve(
  __dirname || process.cwd() + "/tests/intersection",
  "mocks",
);

describe("Phase 6.1: Representative Sampling & Bulk Cheerio Extraction", () => {
  let tempDir: string;
  let liveCaptureDir: string;
  let hydrationDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "fotocopy-bulk-test-"));
    liveCaptureDir = path.join(tempDir, "live_capture");
    hydrationDir = path.join(tempDir, "hydration");

    fs.mkdirSync(liveCaptureDir, { recursive: true });
    fs.mkdirSync(hydrationDir, { recursive: true });

    // Copy mocks
    fs.copyFileSync(
      path.join(mockDir, "apple_dom.html"),
      path.join(liveCaptureDir, "mock.com_apple_dom.html"),
    );
    fs.copyFileSync(
      path.join(mockDir, "banana_dom.html"),
      path.join(liveCaptureDir, "mock.com_banana_dom.html"),
    );
    fs.copyFileSync(
      path.join(mockDir, "orange_dom.html"),
      path.join(liveCaptureDir, "mock.com_orange_dom.html"),
    );

    initializeDatabase(tempDir);
    db.prepare("DELETE FROM url_queue").run();

    // Populate the database
    const insertStmt = db.prepare(
      "INSERT INTO url_queue (url, pathname, status, cluster_id) VALUES (?, ?, ?, ?)",
    );
    insertStmt.run(
      "http://mock.com/apple",
      "/apple",
      "CRAWLED",
      "cluster_fruit",
    );
    insertStmt.run(
      "http://mock.com/banana",
      "/banana",
      "CRAWLED",
      "cluster_fruit",
    );
    insertStmt.run(
      "http://mock.com/orange",
      "/orange",
      "CRAWLED",
      "cluster_fruit",
    );
  });

  afterEach(() => {
    if (db && db.open) {
      db.exec("DELETE FROM url_queue");
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("extracts data across identical structured geometries identically", () => {
    const selectors: SelectorMap = {
      title: "h1.product-headline",
      price: "div.pricing-block > span.amount",
      description: "div.prose.product-desc",
    };

    const count = bulkExtractCluster(
      "cluster_fruit",
      selectors,
      liveCaptureDir,
      hydrationDir,
    );
    expect(count).toBe(3);

    // Verify Output & Files
    const appleData = JSON.parse(
      fs.readFileSync(
        path.join(hydrationDir, "mock.com_apple_cms.json"),
        "utf8",
      ),
    );
    const bananaData = JSON.parse(
      fs.readFileSync(
        path.join(hydrationDir, "mock.com_banana_cms.json"),
        "utf8",
      ),
    );
    const orangeData = JSON.parse(
      fs.readFileSync(
        path.join(hydrationDir, "mock.com_orange_cms.json"),
        "utf8",
      ),
    );

    expect(appleData).toEqual({
      title: "Apple MacBook Pro",
      price: "$1999",
      description: "A powerful laptop for professionals.",
    });

    expect(bananaData).toEqual({
      title: "Banana Phone",
      price: "$9",
      description: "A phone with appeal.",
    });

    expect(orangeData).toEqual({
      title: "Orange Juice Maker",
      price: "$49",
      description: "Fresh juice every morning.",
    });

    // Check statuses advanced to HYDRATED
    const hydratedCount = db
      .prepare("SELECT COUNT(*) as c FROM url_queue WHERE status = 'HYDRATED'")
      .get() as { c: number };
    expect(hydratedCount.c).toBe(3);
  });
});
