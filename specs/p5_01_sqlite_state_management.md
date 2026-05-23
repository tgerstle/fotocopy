# Phase 5.1: Local State Management & SQLite Tracking

## Objective

Implement a robust, disk-based state store to track the migration progress of thousands of URLs, ensuring fault tolerance, safe crash recovery, and prevention of double-processing.

## 1. Architectural Design

We will replace in-memory arrays and flat JSON queue files with a local SQLite database (`migration_state.db`). This allows concurrent worker limits to query the database using standard transaction locking to pick up "PENDING" tasks.

### Dependencies

- `better-sqlite3`: Synchronous, high-performance SQLite driver for Node.js.

## 2. Types & Schema

```typescript
// packages/core/scripts/types/state.ts

export type PipelinePhase =
  | "DISCOVERED"
  | "CRAWLED"
  | "HASHED"
  | "CLASSIFIED"
  | "HYDRATED"
  | "COMPLETED"
  | "FAILED";

export interface UrlRecord {
  id: number;
  url: string;
  pathname: string;
  status: PipelinePhase;
  structural_hash: string | null; // Populated in Phase 2
  cluster_id: string | null; // Populated in Phase 6
  retry_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}
```

### Database Initialization (`state_db.ts`)

```typescript
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.resolve(__dirname, "../../data/migration_state.db");
export const db = new Database(dbPath);

export function initializeDatabase() {
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

export function claimBatch(phase: PipelinePhase, limit = 10): UrlRecord[] {
  // Using an immediate update to lock rows for parallel workers
  const stmt = db.prepare(`
    UPDATE url_queue SET status = 'PROCESSING_' || ? 
    WHERE id IN (
      SELECT id FROM url_queue WHERE status = ? LIMIT ?
    )
    RETURNING *;
  `);
  return stmt.all(phase, phase, limit) as UrlRecord[];
}
```

## 3. Testing & Regression Strategy

### Unit Tests (`state_db.test.ts`)

- **Concurrency Test:** Simulate 3 workers calling `claimBatch('DISCOVERED', 5)` simultaneously. Assert that exactly 15 unique URLs are returned with no overlaps.
- **Crash Recovery Test:** Manually inject rows with status `PROCESSING_CLASSIFIED`. Run a startup cleanup script that reverts all `PROCESSING_*` tags back to their base phase `CLASSIFIED`. Assert the DB heals hanging jobs on process restart.
