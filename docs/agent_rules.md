# Agent Rules & Workflow

**Purpose:** This document strictly defines the behavioral loop and responsibilities for any AI agent interacting with this codebase.

## 1. The Core Implementation Loop

When an agent begins a task, they must adhere to the following sequence:

1. **Read Context:** Read `docs/handoff.md` to understand the current phase, followed by the specific `specs/` file for the component being built.
2. **Develop & Test:** Write the code and the corresponding test cases in the `tests/` directory as mandated by the spec.
3. **Execute Tests:** Run the test suite to ensure the new code works and nothing else broke.
4. **Update Spec:** Keep the specification documents alive. Update the "Implementation Status" checklists within the relevant `specs/*.md` files as parts of the feature are completed.
5. **Update Handoff:** Log what was accomplished, what remains, and any new blockers in `docs/handoff.md` before ending the session.

## 2. Phase Completion Protocol

When an agent completes the final task of a major Phase (e.g., finishing Phase 1), they must halt feature development and execute the **Phase Wrap-Up Routine**:

1. **Dead Code Elimination:** Scan the codebase for unused files, deprecated functions, and commented-out placeholder logic. Remove it to keep the repository lean.
2. **Regression Verification:** Run the comprehensive test suite (`npm run test`) to mathematically prove that the dead-code removal and phase integration caused zero regressions.
3. **Documentation Sync:**
   - Update top-level architecture documents (like `specs/overview.md` and `docs/`) to accurately reflect the real-world finalized state of the Phase.
   - Modify `docs/handoff.md` to formally close out the current Phase and initialize the goals for the next Phase.

## 3. General Behavioral Constraints

- **No Blind Refactoring:** Do not refactor code outside the scope of the current `handoff.md` objective unless explicitly instructed, or during the Phase Wrap-Up dead-code elimination.
- **Never Simulate Tools:** Always invoke the actual tools provided (read files, write files, run terminal commands) rather than simulating them in prose.
- **Zero Broken States:** Do not abandon a session with a broken test suite. Revert or fix your changes before modifying `handoff.md`.
