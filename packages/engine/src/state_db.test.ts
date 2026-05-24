import { describe, it, expect, beforeEach, afterAll } from "vitest";
import * as path from "path";
import {
  db,
  initializeDatabase,
  claimBatch,
  resetHangingJobs,
  handleFailure,
} from "./state_db";

describe("SQLite State Management", () => {
  beforeEach(() => {
    initializeDatabase(path.resolve(__dirname, "../../../output/test_output"));
    // Clear out table completely before each test
    db.exec(`
      DROP TABLE IF EXISTS url_queue;
    `);
    initializeDatabase(path.resolve(__dirname, "../../../output/test_output"));
  });

  afterAll(() => {
    // Cleanup
    if (db) db.exec(`DROP TABLE IF EXISTS url_queue;`);
  });

  it("initializes the database correctly", () => {
    const tableInfo = db.prepare("PRAGMA table_info(url_queue)").all();
    expect(tableInfo.length).toBeGreaterThan(0);
  });

  it("allows inserting discovering and atomic batch claiming", () => {
    const insert = db.prepare(
      "INSERT INTO url_queue (url, pathname, status) VALUES (?, ?, 'DISCOVERED')",
    );
    insert.run("https://css-snacks.com/1", "/1");
    insert.run("https://css-snacks.com/2", "/2");
    insert.run("https://css-snacks.com/3", "/3");

    // Claim 2
    const batch1 = claimBatch("DISCOVERED", 2);
    expect(batch1).toHaveLength(2);
    expect(batch1[0].status).toBe("PROCESSING_DISCOVERED");

    // Claim remaning
    const batch2 = claimBatch("DISCOVERED", 2);
    expect(batch2).toHaveLength(1);
    expect(batch2[0].url).toBe("https://css-snacks.com/3");
  });

  it("recovers hanging jobs on startup", () => {
    const insert = db.prepare(
      "INSERT INTO url_queue (url, pathname, status) VALUES (?, ?, 'PROCESSING_CLASSIFIED')",
    );
    insert.run("https://css-snacks.com/hung", "/hung");

    resetHangingJobs();

    const record = db
      .prepare("SELECT * FROM url_queue WHERE url = ?")
      .get("https://css-snacks.com/hung") as any;
    expect(record.status).toBe("CLASSIFIED");
  });

  it("handles updates and failures incrementally", () => {
    const insert = db.prepare(
      "INSERT INTO url_queue (url, pathname, status) VALUES (?, ?, 'DISCOVERED')",
    );
    const info = insert.run("https://css-snacks.com/fail", "/fail");
    const id = info.lastInsertRowid as number;

    const record = db
      .prepare("SELECT * FROM url_queue WHERE id = ?")
      .get(id) as any;

    handleFailure(record, "DISCOVERED", 1);

    const updated = db
      .prepare("SELECT * FROM url_queue WHERE id = ?")
      .get(id) as any;

    // Attempt 1: Reverted to DISCOVERED with 1 retry
    expect(updated.status).toBe("DISCOVERED");
    expect(updated.retry_count).toBe(1);

    // Fail again over max (max is 1)
    handleFailure(updated, "DISCOVERED", 1);
    const final = db
      .prepare("SELECT * FROM url_queue WHERE id = ?")
      .get(id) as any;
    expect(final.status).toBe("FAILED");
    expect(final.last_error).toContain("Exceeded max retries");
  });
});
