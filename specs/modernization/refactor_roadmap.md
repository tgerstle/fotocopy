# Architectural Modernization & Refactor Roadmap

This document outlines the step-by-step phases to transition the Fotocopy codebase from an experimental prototype into a robust, enterprise-grade tool.

## Phase 1: Package Management Migration (`pnpm`)

**Goal:** Drastically reduce disk footprint, prevent phantom dependencies, and speed up both the workspace installation and the dynamic sandbox generation.

- **Step 1.1:** Delete all existing `node_modules` folders and `package-lock.json` files across the workspace.
- **Step 1.2:** Define `pnpm-workspace.yaml` in the root directory to officially declare the monorepo structure.
- **Step 1.3:** Update the root `package.json` to include the `"packageManager"` field specifying the exact `pnpm` version.
- **Step 1.4:** Run `pnpm install` at the root to generate a `pnpm-lock.yaml`.
- **Step 1.5:** Update internal scripts (e.g., `sandbox_extractor.ts` and `preview.sh`) to execute `pnpm install` instead of `npm ci` or `npm install` for the output sandboxes.

## Phase 2: Tooling & DX (Developer Experience) Standardization

**Goal:** Enforce unified code style, catch errors pre-commit, and consolidate configuration at the root level.

- **Step 2.1:** Move shared development tools (`husky`, `lint-staged`, `typescript`, `vitest`, `prettier`, `eslint`) from `packages/core/package.json` up to the root `package.json`.
- **Step 2.2:** Create a root `tsconfig.base.json` with strict type-checking that all package-level TS configs will extend.
- **Step 2.3:** Add root `.prettierrc` and `eslint.config.js` (or legacy `.eslintrc`) configurations.
- **Step 2.4:** Configure `husky` and `lint-staged` at the root to format and lint on every git commit.
- **Step 2.5:** Run a one-time workspace-wide format/lint fix to establish the baseline.

## Phase 3: Monorepo Decomposition

**Goal:** Break the `packages/core` monolith into focused, domain-specific packages to improve maintainability and testability.

- **Step 3.1:** Scaffold new package directories (`packages/cli`, `packages/llm`, `packages/engine` or similar breakdown).
- **Step 3.2:** Migrate CLI orchestration (e.g., `pipeline_runner.ts`) to `@fotocopy/cli`.
- **Step 3.3:** Migrate LLM clients, AST guards, and prompt generation to `@fotocopy/llm`.
- **Step 3.4:** Migrate DOM analysis, intersection logic, and hashing to `@fotocopy/engine`.
- **Step 3.5:** Update `package.json` dependencies to use `workspace:*` linking between the internal packages.
- **Step 3.6:** Improve CLI UX by introducing a library like `@clack/prompts` or `ora` to replace the walls of `console.log` output with clean progress indicators.

## Phase 4: Reliability & Error Handling

**Goal:** Ensure the pipeline fails predictably and gracefully on bad inputs or severe interruptions.

- **Step 4.1:** Implement Zod runtime validation for `fotocopy.config.ts`. If the config is malformed, halt the CLI immediately with actionable error messages.
- **Step 4.2:** Register global `process.on('SIGINT')` and `SIGTERM` shutdown handlers.
- **Step 4.3:** Ensure browser instances (Playwright) or LLM generation loops gracefully terminate and clean up temporary files/locks if the process is killed.

## Phase 5: CI/CD Automation

**Goal:** Prevent future regressions by enforcing checks on Pull Requests.

- **Step 5.1:** Create `.github/workflows/ci.yml`.
- **Step 5.2:** Add steps to checkout code, setup Node.js/pnpm, and install dependencies.
- **Step 5.3:** Add steps to run the root Linting, Type-checking (`tsc --noEmit`), and Unit Tests (`vitest`).
