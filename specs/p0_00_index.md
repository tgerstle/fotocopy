# Phase 0: Tracer Bullet (End-to-End Simulation)

The Tracer Bullet phase is designed to validate our entire migration methodology _before_ we build the automated crawler or configure the LLM.

Instead of just mocking the final CMS data, we will manually create mock outputs for _every stage_ of the pipeline. We then write minimal Node scripts to transform these mocks from one step to the next, proving that the data flow (from raw CSS tokens to Next.js components) is computationally unbroken.

## Tracer Bullet Spec Breakdown

- [p0_01_mock_capture.md](p0_01_mock_capture.md): Simulates Phase 1 (Capture) & Phase 2 (Slicing/Intersection). Mocks the raw isolated DOM chunk with `data-awa-id` stamps and natively extracted W3C DTCG design tokens.
- [p0_02_mock_llm.md](p0_02_mock_llm.md): Simulates Phase 3 (LLM Classification). Mocks the exact JSON pointer object the LLM will generate to prevent hallucination.
- [p0_03_hydrator.md](p0_03_hydrator.md): Simulates Phase 3 (Hydration Engine). A script that reads the LLM mock from Step 2, searches the DOM mock from Step 1, extracts the actual text/images, and formats the CMS-ready JSON blueprint.
- [p0_04_cms_frontend.md](p0_04_cms_frontend.md): Simulates Phase 4 (Scaffolding) & Phase 5 (Local Execution). Initializes the Next.js App Router workspace, consumes the hydrated JSON blueprints, and natively applies the W3C design tokens via Tailwind.
- [p0_05_test_suite.md](p0_05_test_suite.md): Establishes the Vitest execution loop that guarantees the schemas enforce the data shapes end-to-end.
- [p0_06_configuration.md](p0_06_configuration.md): Simulates how a `fotocopy.config.ts` plugin/hook system intercepts the pipeline to globally dictate routes, LLM models, and manual overrides.
- [p0_07_git_hooks.md](p0_07_git_hooks.md): Hardens the code review process by defining `husky` and `lint-staged` pre-commit rules, guaranteeing tests pass before saving to git.

By building these micro-scripts and mocks first, we guarantee that the complex logic of Phases 1-5 will securely click together.
