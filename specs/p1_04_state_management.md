# Phase 1, Step 6: State Management, Idempotency & DLQ

When scraping hundreds or thousands of legacy pages, the crawler cannot be fragile. Network drops, LLM timeouts, and malformed HTML will occur. This spec defines the state management required to ensure the pipeline is robust, resumable, and auditable.

## 1. Local Ledger (Checkpointing)

We establish a local state ledger (e.g., SQLite or a `.fotocopy/state.json` file) to track the exact progress of every URL.

**Implementation:**

- Before crawling a URL, check the ledger.
- If `status === 'completed_phase_4'`, skip the crawl/LLM steps entirely.
- This provides **idempotency**. An engineer can terminate the process (`Ctrl+C`) at any time. Upon restart, the engine instantly skips all finished pages and resumes exactly where it left off.

## 2. Dead Letter Queue (DLQ)

A failure on a single page must never crash the Node process. We sandbox execution using `try/catch` and Error Boundaries.

**Implementation:**

- If a page fails (e.g., Playwright timeout, Gemma generates invalid JSON 3 times in a row, or Hydrator fails to find an ID):
  1. The error is intercepted.
  2. The URL, error stack, and raw HTML snippet are pushed into `.fotocopy/dlq.json`.
  3. The process gracefully continues to the next URL.
- This allows engineers to run the engine overnight, wake up to 995 successful pages, and investigate the 5 weird edge cases in the DLQ manually.

## 3. Structured Telemetry (Logging)

We replace `console.log` with a structured logger (like Pino).

**Format:**

```json
{"level": "info", "time": 1716120000, "page": "/about", "phase": "llm", "msg": "Structured Output received"}
{"level": "warn", "time": 1716120002, "page": "/about", "phase": "hydrator", "msg": "NodeId 999 not found. Simulating fallback."}
```

This enables fast filtering of logs when debugging pipeline stalls.
