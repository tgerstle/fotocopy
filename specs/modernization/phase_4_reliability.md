# Phase 4: Reliability & Error Handling

## Objective

Prevent silent configuration failures, manage system memory defensively, and ensure robust teardown lifecycles on application aborts.

## Deep Dive & Current State

- `fotocopy.config.ts` is imported as a raw object. Invalid values (e.g., negative temperatures, uninstalled Ollama models, bad timeouts) cause obscure errors deep in the pipeline.
- Pipeline execution crashes (like the `SIGKILL 137` OOM errors) or `Ctrl+C` abandons Playwright background instances and Ollama API load.

## Execution Steps

1. **Zod Runtime Configurations**:
   - In `/packages/cli/src/config/`, define `ConfigSchema` using Zod.
   - During boot in `pipeline_runner.ts`, execute `ConfigSchema.parse(userConfig)`. Fail instantly with Zod validation text if the schema is malformed.
2. **Graceful Teardown Hooks**:
   - Implement a singleton `TeardownManager`.
   - Register listeners for `process.on('SIGINT')` and `process.on('SIGTERM')`.
   - In the listener, synchronously dispatch cleanup tasks:
     - `browser.close()` for Playwright.
     - Emit standard AbortController signals (`AbortSignal.timeout`) to cancel hanging `fetch` requests towards Ollama.

## Testing & Verification (Fast Velocity)

- **Mock Config Testing**:
  Create `packages/cli/tests/config_validation.test.ts`. Provide a mock JSON with `temperature: "high"`. Assert that Zod throws a highly legible validation UI error rather than proceeding.
- **Mock Teardown Lifecycle**:
  In a test stub, register a dummy resource to the `TeardownManager`. Use `process.emit('SIGINT')` artificially and assert the dummy resource's `.dispose()` method was executed before the process resolution finishes.
