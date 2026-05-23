# Phase 1: Package Management Migration (pnpm)

## Objective

Migrate the workspace from `npm` to `pnpm` to leverage global store caching, strictly enforce dependency boundaries, and radically speed up the dynamic component sandbox generation.

## Deep Dive & Current State

- The root uses `npm run migrate` mapping into `packages/core`.
- The sandbox generation (`packages/core/scripts/scaffolding/sandbox_extractor.ts`) executing `npm ci` causes full downloads per scraped site, leading to slow output builds.
- Lockfiles exist as `package-lock.json`.
- `scripts/preview.sh` uses `npm install`.

## Execution Steps

1. **Cleanup**:
   - Recursively delete `node_modules` and `package-lock.json` in `/`, `/packages/core`, and `/output/*`.
2. **Configuration**:
   - Add `pnpm-workspace.yaml` in the root:
     ```yaml
     packages:
       - "packages/*"
     ```
   - In root `package.json`, set `"packageManager": "pnpm@9.x.x"`.
3. **Script Adjustments**:
   - Update `packages/core/scripts/scaffolding/sandbox_extractor.ts`: Replace `execSync("npm ci ...")` with `execSync("pnpm install --no-frozen-lockfile", ...)` (evaluating sandbox needs).
   - Update `scripts/preview.sh`: Replace `npm install` and `npm run storybook` with `pnpm install` and `pnpm run storybook`.
4. **Bootstrapping**:
   - Run `pnpm install` from the root to generate `pnpm-lock.yaml`.

## Testing & Verification (Fast Velocity)

- **Unit Test (Mock Extractor)**:
  Create `packages/core/tests/sandbox_extractor.test.ts`. Stub `child_process.execSync` and trigger the extraction function in a contained/mock environment. Assert that `pnpm install` is the command dispatched.
- **Dry Run**:
  Execute `pnpm install --offline` to ensure workspace linking resolves perfectly without network.
