import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { runDiscovery } from "@fotocopy/engine";
import { processChunks } from "@fotocopy/llm";
import {
  initializeDatabase,
  db,
  claimBatch,
  updateStatus,
  resetHangingJobs,
} from "@fotocopy/engine";
import fs from "fs";
import path from "path";
import os from "os";

vi.mock("@fotocopy/engine", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    runDiscovery: vi.fn(),
    crawlAndCapture: vi.fn(),
    computeGlobalIntersections: vi.fn(),
    purgeAndSlicePage: vi.fn(),
    extractTokens: vi.fn(),
    getConfig: vi.fn().mockReturnValue({}),
    setConfig: vi.fn(),
    // We need a getter to capture the live db reference because it's a 'let' export that gets assigned during initializeDatabase
    get db() {
      return actual.db;
    },
  };
});

vi.mock("@fotocopy/llm", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    processChunks: vi.fn(),
    classifyGlobals: vi.fn(),
    hydrate: vi.fn(),
    consolidateComponents: vi.fn(),
    extractSampleData: vi.fn(),
    generatePrompts: vi.fn(),
    generateGlobalPrompts: vi.fn(),
    extractSandboxTemplate: vi.fn(),
    injectTokensToCSS: vi.fn(),
  };
});

let tempDir: string;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "fotocopy-test-"));
  initializeDatabase(tempDir);
  db.prepare("DELETE FROM url_queue").run();
});

afterEach(() => {
  if (db && db.open) {
    db.exec("DELETE FROM url_queue"); // Clear after use
  }
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test("Phase 5.1: The State Loop accurately batches and advances statuses", () => {
  const insertStmt = db.prepare(
    "INSERT INTO url_queue (url, pathname) VALUES (?, ?)",
  );
  for (let i = 1; i <= 11; i++) {
    insertStmt.run(`http://mock.com/${i}`, `/${i}`);
  }

  const batch1 = claimBatch("DISCOVERED", 5);
  expect(batch1.length).toBe(5);
  expect(batch1[0].status).toBe("PROCESSING_DISCOVERED");

  batch1.forEach((record) => updateStatus(record.id, "CRAWLED"));

  const batch2 = claimBatch("DISCOVERED", 5);
  expect(batch2.length).toBe(5);
  batch2.forEach((record) => updateStatus(record.id, "CRAWLED"));

  const batch3 = claimBatch("DISCOVERED", 5);
  expect(batch3.length).toBe(1);

  const crawledCount = db
    .prepare("SELECT COUNT(*) as c FROM url_queue WHERE status = 'CRAWLED'")
    .get() as { c: number };
  expect(crawledCount.c).toBe(10);
});

test("Phase 5.1: Resilience and Crash Recovery heals hanging jobs", () => {
  db.prepare(
    "INSERT INTO url_queue (url, pathname, status) VALUES (?, ?, ?)",
  ).run("http://crash.com/1", "/1", "PROCESSING_CRAWLED");
  db.prepare(
    "INSERT INTO url_queue (url, pathname, status) VALUES (?, ?, ?)",
  ).run("http://crash.com/2", "/2", "PROCESSING_HASHED");

  resetHangingJobs();

  const healedCrawled = db
    .prepare("SELECT COUNT(*) as c FROM url_queue WHERE status = 'CRAWLED'")
    .get() as { c: number };
  expect(healedCrawled.c).toBe(1);

  const healedHashed = db
    .prepare("SELECT COUNT(*) as c FROM url_queue WHERE status = 'HASHED'")
    .get() as { c: number };
  expect(healedHashed.c).toBe(1);

  const processingCount = db
    .prepare(
      "SELECT COUNT(*) as c FROM url_queue WHERE status LIKE 'PROCESSING_%'",
    )
    .get() as { c: number };
  expect(processingCount.c).toBe(0);
});

test("Phase 5.1: Idempotency prevents duplicates on spider re-runs", () => {
  const insertMockSpider = () => {
    const stmt = db.prepare(
      "INSERT INTO url_queue (url, pathname) VALUES (?, ?) ON CONFLICT(url) DO NOTHING",
    );
    db.transaction(() => {
      stmt.run("http://demo.com/A", "/A");
      stmt.run("http://demo.com/B", "/B");
    })();
  };

  insertMockSpider();
  let total = db.prepare("SELECT COUNT(*) as c FROM url_queue").get() as {
    c: number;
  };
  expect(total.c).toBe(2);

  db.prepare(
    "UPDATE url_queue SET status = 'COMPLETED' WHERE url = 'http://demo.com/A'",
  ).run();

  insertMockSpider();

  total = db.prepare("SELECT COUNT(*) as c FROM url_queue").get() as {
    c: number;
  };
  expect(total.c).toBe(2);

  const completedRecord = db
    .prepare("SELECT status FROM url_queue WHERE url = 'http://demo.com/A'")
    .get() as { status: string };
  expect(completedRecord.status).toBe("COMPLETED");
});
