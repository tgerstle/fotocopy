# Phase 5: CI/CD Automation

## Objective

Enforce repository code quality automatically on Pull Requests to prevent regressions before they reach the main branch.

## Deep Dive & Current State

- The workspace executes locally.
- A missing import or failing type-check might go unnoticed until deployment if a developer bypasses local tooling.

## Execution Steps

1. **GitHub Actions Workflow**:
   - Create `.github/workflows/ci.yml`.
2. **Workflow Definition**:
   Ensure the following pipeline steps are mapped in the YAML:
   - `actions/checkout@v4`
   - `pnpm/action-setup@v3`
   - `actions/setup-node@v4` with node-version matching package constraints.
   - `pnpm install --frozen-lockfile` (ensures `pnpm-lock.yaml` is immutable).
   - `pnpm run lint` (ESLint on all TS files).
   - `pnpm run typecheck` (`tsc --noEmit` locally verifying TS syntax parity).
   - `pnpm run test` (Vitest unit execution across all packages).

## Testing & Verification (Fast Velocity)

- **Local CI Execution via `act`**:
  If `act` (act CLI tool) is installed, run `act pull_request` in the root directory. This simulates the GitHub Action Docker runtime locally.
- **Manual Verification**:
  In the shell, sequence the intended execution exactly as CI would:
  ```bash
  rm -rf node_modules packages/*/node_modules
  pnpm install --frozen-lockfile
  pnpm test:core
  ```
  Ensure the entire sequence returns exit code `0`.
