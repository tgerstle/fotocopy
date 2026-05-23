# Phase 2: Tooling & DX Standardization

## Objective

Standardize the developer experience with uniformly enforced formatting, linting, and type-checking at the root space rather than trapped within child packages.

## Deep Dive & Current State

- `packages/core/package.json` currently holds `husky`, `lint-staged`, `typescript`, `vitest` as `devDependencies`.
- No root-level `.prettierrc` or `eslint.config.js`.
- Lack of overarching pre-commit hook consistency outside of `core`.

## Execution Steps

1. **Dependency Hoisting**:
   - Move `typescript`, `vitest`, `husky`, `lint-staged` to the root `package.json` `devDependencies`.
   - Install `prettier`, `eslint`, and `@typescript-eslint/parser`.
2. **Configuration Standardization**:
   - Create `tsconfig.base.json` at root with `strict: true`, `target: ES2022`, `moduleResolution: bundler`.
   - Update `packages/core/tsconfig.json` to `"extends": "../../tsconfig.base.json"`.
   - Create `.prettierrc` (e.g., semi: true, trailingComma: all).
   - Create `eslint.config.js` targeting modern flat-config logic.
3. **Hook Registration**:
   - Setup `husky` via `pnpm exec husky init`.
   - Configure `.husky/pre-commit` to run `pnpm lint-staged`.
   - Configure root `package.json` lint-staged block to run `prettier --write` and `eslint --fix` on `*.ts`.

## Testing & Verification (Fast Velocity)

- **Mock Pre-commit**:
  Create a deliberately malformed file (`scripts/mock_bad_format.ts` with bad spacing and unused variables). Run `pnpm lint-staged` manually targeting just that file. Assert it auto-formats and throws lint warnings.
- **Mock Type Verification**:
  Run `pnpm exec tsc --noEmit --project packages/core/tsconfig.json` to ensure the extended base config correctly compiles the child module without breaking.
