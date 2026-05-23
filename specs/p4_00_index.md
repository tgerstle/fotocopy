# Phase 4: Component Scaffolding & Verification (Overview)

## Objective

We have strict data structures (Zod schemas) outputted by the LLM and Hydrator. Now we need to generate the React components (e.g., `Hero.tsx`) that consume this data perfectly. Instead of Gemma trying to write React code, we build a bridge for **GitHub Copilot**.

## Core Concepts (To be drilled down)

### 1. The Prompt Generator

The Node Orchestrator will analyze all the Zod schemas present in the final data output.

- **Action:** For every unique block type (e.g., `ContentWithImage`), the script generates a `/prompts/ContentWithImage.prompt.md` file.

### 2. Context Injection

The generated `.prompt.md` file automatically includes:

- The strict TypeScript interface it must satisfy.
- The Tailwind design tokens (colors/fonts) extracted in Phase 1.
- Instructions to use React best practices (e.g., `next/image`).

### 3. The Developer Q/A Loop (Storybook Pivot)

- An engineer opens the generated prompt and uses native VS Code Copilot Chat to execute it (or the Orchestrator auto-generates them via Ollama).
- The LLM generates the perfectly typed React component AND a `.stories.tsx` file padded with mock data fulfilling its Zod schema.
- The component is rendered in isolation via Storybook (`npm run storybook`) locally, entirely decoupled from front-end routing.

## Core Specs

1. **[W3C Design Token Integration](./p4_01_design_tokens.md)** - Consuming the strictly formatted W3C DTCG styles extracted in Phase 1 directly into Tailwind and Copilot contexts without translation.
2. **[Automated Component Prompts](./p4_02_prompt_generator.md)** - Logic to automatically construct `.prompt.md` files containing Zod definitions and Tokens for code generation.
3. **[Global Pipeline Runner](./p4_03_pipeline_runner.md)** - A unified Node.js executable that acts as the master conductor for the entire backend data extraction and structure engine.

## Impact on Tracer Bullet (Phase 0)

- Adds a step where we automatically generate a `.tsx` and `.stories.tsx` for our mock `Hero` block based on the `CMSBlockSchema` we defined in `p0_03_hydrator.md`.
