# Phase 0, Step 7: Pre-Commit Validation (Husky & Lint-Staged)

In a highly automated, AI-assisted development environment, it is easy to introduce subtle typing errors or break a data schema contract. We enforce a strict "shift-left" validation loop where broken code cannot be committed to Git.

## 1. The Tools

- **Husky:** Hooks into Git's native events (like `pre-commit`).
- **Lint-Staged:** Instead of running the linter/formatter on the entire codebase (which takes too long), it only runs tests and checks on the files staged for the current commit.

## 2. Configuration

**`package.json` setup:**

```json
{
  "scripts": {
    "prepare": "husky install",
    "test:tracer": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "lint-staged": {
    "*.{ts,tsx,js}": ["eslint --fix", "prettier --write"],
    "*(schemas|tests|scripts)/*.{ts,js}": [
      "npm run typecheck",
      "npm run test:tracer"
    ]
  }
}
```

## 3. The Pre-commit Hook (`.husky/pre-commit`)

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

## Verification

If an engineer or AI agent modifies `schemas/llm.ts` and purposefully introduces a syntactic error, typing `git commit -m "Update schema"` will be instantly rejected by the terminal, forcing a fix before the Git history is contaminated.
