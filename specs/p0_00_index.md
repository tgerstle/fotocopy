# Phase 0: Tracer Bullet (End-to-End Simulation)

The Tracer Bullet phase is designed to validate our entire migration methodology _before_ we build the automated crawler or configure the LLM.

Instead of just mocking the final CMS data, we will manually create mock outputs for _every stage_ of the pipeline. We then write minimal Node scripts to transform these mocks from one step to the next, proving that the data flow (from raw CSS tokens to Next.js components) is computationally unbroken.

## Tracer Bullet Spec Breakdown (Implementation Status)

- [x] **[p0_01_mock_capture.md](p0_01_mock_capture.md)**: Simulates Phase 1 (Capture) & Phase 2 (Slicing/Intersection). _Complete: Mocks and schema (`schemas/tokens.ts`) are built._
- [x] **[p0_02_mock_llm.md](p0_02_mock_llm.md)**: Simulates Phase 3 (LLM Classification). _Complete: LLM JSON pointer mock and schema (`schemas/llm.ts`) are built._
- [x] **[p0_03_hydrator.md](p0_03_hydrator.md)**: Simulates Phase 3 (Hydration Engine). _Complete: Node script written and verified to extract HTML without hallucination._
- [x] **[p0_04_cms_frontend.md](p0_04_cms_frontend.md)**: Simulates Phase 4 (Scaffolding) & Phase 5 (Local Execution). _Complete: Next.js App Router configured with dynamic optional catch-all routing._
- [x] **[p0_05_test_suite.md](p0_05_test_suite.md)**: Establishes the Vitest execution loop. _Complete: Mocks and Hydrator tests all pass in the NPM Workspace._
- [x] **[p0_06_configuration.md](p0_06_configuration.md)**: Simulates how a `fotocopy.config.ts` plugin/hook system intercepts the pipeline. _Complete: Extracted root constants to fotocopy.config.ts._
- [ ] **[p0_07_git_hooks.md](p0_07_git_hooks.md)**: Hardens the code review process with `husky` / `lint-staged`. _Pending._

By building these micro-scripts and mocks first, we guarantee that the complex logic of Phases 1-5 will securely click together.
