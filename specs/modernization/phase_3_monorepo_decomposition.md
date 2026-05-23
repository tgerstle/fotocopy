# Phase 3: Monorepo Decomposition

## Objective

Dissolve the `packages/core` monolith into highly cohesive, single-responsibility packages decoupled from each other.

## Deep Dive & Current State

`packages/core` currently manages:

- **CLI / Pipeline Runner:** Argument parsing, reading `fotocopy.config.ts`, lifecycle orchestration.
- **Engine:** DOM geometric analysis, overlap intersection (`hash_engine.ts`), CSS parsing.
- **LLM:** Fetching from Ollama, Zod schema constraints, AST Guards (`ast_guard.ts`), template compilation.

## Execution Steps

1. **Scaffold Packages**:
   - Create directories: `packages/cli`, `packages/engine`, `packages/llm`.
   - Initialize `package.json` and `tsconfig.json` (extending base) in each.
2. **Migrate Business Logic**:
   - Move `pipeline_runner.ts` and config loaders to `/cli`.
   - Move `hash_engine.ts`, DOM geometry, and Slicer logic to `/engine`.
   - Move `ollama_client.ts`, `ast_guard.ts`, and component generators to `/llm`.
3. **Workspace Linking**:
   - Update `packages/cli/package.json` to include `"dependencies": { "@fotocopy/engine": "workspace:*", "@fotocopy/llm": "workspace:*" }`.
4. **Refactor Imports**:
   - Update internal file imports across the new packages. Shift from deep relative imports (`../../`) to monorepo package imports (`import { generateCode } from "@fotocopy/llm"`).

## Testing & Verification (Fast Velocity)

- **Unit Tests Transfer**: Move existing Vitest tests matching their respective domains. Execute `pnpm run test --filter "@fotocopy/*"` indicating all bounded contexts pass in isolation.
- **Mock Pipeline Stub**: Create `packages/cli/tests/mock_pipeline.test.ts`. Mock the exports of `@fotocopy/engine` and `@fotocopy/llm` ensuring the CLI orchestration file calls them in the correct sequential order without running a real browser or requiring Ollama.
