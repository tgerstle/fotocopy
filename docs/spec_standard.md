# Specification & Testing Standard

**Purpose:** To guarantee that the codebase remains stable as agents iteratively build the system.

## 1. Spec Status Tracking

Every spec file in the `specs/` directory MUST contain an **Implementation Status** section at the bottom. This section should have checkboxes mapping to the core features described.

- [ ] Not Started
- [~] In Progress
- [x] Completed

## 2. Test-Driven Verification

Every spec file MUST include a **Verification & Tests** section.

- This section defines exact commands an agent can run in the terminal to verify the feature works.
- Agents must write corresponding unit/integration tests (e.g., using `vitest` or `playwright test`) into a unified `/tests` directory as they write the code.
- **The Rule of Regression:** An agent must run the entire `/tests` suite at the end of their session. If a test is broken, the agent must not update the handoff document as "Completed" until it is fixed.

## 3. Directory Structure

- `specs/` - Architecture documents following this standard.
- `docs/` - Living documentation representing the current codebase (e.g., `handoff.md`, API references).
- `tests/` - The unified test suite (`vitest`).
- `src/` - Application logic.

## 4. Scaffold Options
The project supports turning LLM Prompts directly into .tsx boilerplate. 
Toggle `llm.autoGenerateComponents: true` in `fotocopy.config.ts` to enable physically writing files to `output/components/` as the pipeline finishes.
