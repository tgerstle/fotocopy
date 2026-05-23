import Database from "better-sqlite3";
import path from "path";
import * as fs from "fs";
import { PipelinePhase, UrlRecord } from "./types/state";

export let db: Database.Database;

export function initializeDatabase(workingDir: string) {
  const dbDir = path.resolve(workingDir, ".fotocopy");

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, "migration_state.db");
  db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS url_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT UNIQUE NOT NULL,
      pathname TEXT NOT NULL,
      status TEXT DEFAULT 'DISCOVERED',
      structural_hash TEXT,
      cluster_id TEXT,
      retry_count INTEGER DEFAULT 0,
      last_error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_status ON url_queue(status);
    CREATE INDEX IF NOT EXISTS idx_hash ON url_queue(structural_hash);
  `);
}

/**
 * Clean up hanging jobs on startup.
 * Converts 'PROCESSING_X' back to 'X' so they can be picked up again safely.
 */
export function resetHangingJobs() {
  db.exec(`
    UPDATE url_queue 
    SET status = REPLACE(status, 'PROCESSING_', '') 
    WHERE status LIKE 'PROCESSING_%'
  `);
}

/**
 * Atomically claim a batch of URLs for a given phase.
 * Appends 'PROCESSING_' to the status to lock the record for the current worker.
 */
export function claimBatch(phase: PipelinePhase, limit = 10): UrlRecord[] {
  // SQLite doesn't natively support UPDATE ... RETURNING * directly combined with LIMIT in a single standard cross-version way,
  // but better-sqlite3 with RETURNING works perfectly!
  const stmt = db.prepare(`
    UPDATE url_queue SET status = 'PROCESSING_' || ? 
    WHERE id IN (
      SELECT id FROM url_queue WHERE status = ? LIMIT ?
    )
    RETURNING *;
  `);

  return stmt.all(phase, phase, limit) as UrlRecord[];
}

/**
 * Update the status of a specific URL record.
 */
export function updateStatus(
  id: number,
  nextStatus: PipelinePhase,
  additionalUpdates: Partial<UrlRecord> = {},
) {
  const updates = [];
  const values: any[] = [];

  updates.push("status = ?");
  values.push(nextStatus);

  if (additionalUpdates.structural_hash !== undefined) {
    updates.push("structural_hash = ?");
    values.push(additionalUpdates.structural_hash);
  }

  if (additionalUpdates.cluster_id !== undefined) {
    updates.push("cluster_id = ?");
    values.push(additionalUpdates.cluster_id);
  }

  if (additionalUpdates.last_error !== undefined) {
    updates.push("last_error = ?");
    values.push(additionalUpdates.last_error);
  }

  updates.push("updated_at = CURRENT_TIMESTAMP");

  const query = `UPDATE url_queue SET ${updates.join(", ")} WHERE id = ?`;
  values.push(id);

  db.prepare(query).run(...values);
}

/**
 * Increment the retry count and set the record back to FAILED if it exceeds maximum,
 * or back to the original phase if it can retry.
 */
export function handleFailure(
  record: UrlRecord,
  targetPhase: PipelinePhase,
  maxRetries = 3,
) {
  if (record.retry_count >= maxRetries) {
    updateStatus(record.id, "FAILED", {
      last_error: `Exceeded max retries (${maxRetries}) for phase ${targetPhase}`,
    });
  } else {
    // Increment retry count and revert status to targetPhase so it gets picked up again
    db.prepare(
      `
      UPDATE url_queue 
      SET status = ?, 
          retry_count = retry_count + 1, 
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `,
    ).run(targetPhase, record.id);
  }
}
