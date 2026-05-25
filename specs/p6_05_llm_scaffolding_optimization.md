# Phase 6.05: LLM Scaffolding Optimization & Pass Segmentation

## Overview
Currently, the LLM component scaffolding pipeline relies on an overloaded "zero-shot" generating pass in `packages/llm/src/scaffolding/prompt_generator.ts`. The LLM receives instructions to infer Shadcn architecture, build markup with Tailwind mappings, and output a valid `.stories.tsx` side-by-side. 
This heavily bloated token buffer leads to timeouts (`UND_ERR_HEADERS_TIMEOUT`), "stream aborted" scenarios due to hitting local LLM `num_predict` caps, and frequent AST parsing failures.

This specification redesigns the scaffolding system into a multi-pass pipeline to segment context, drastically shrink output scopes, enforce deterministic behavior, and stabilize the Vite Sandbox.

---



## Progress Tracker
- [x] **Phase 1: Context Isolation (Sandbox Scanning)**
  - Pre-installed primitives in sandbox.
  - Implemented `manifest_builder.ts`.
- [x] **Phase 2: Structural Decoupling (`generatePrompts` bifurcation)**
  - Split generation into separate component and Storybook passes.
  - Reduced token output sizes and implemented sequential fallback loops.
- [x] **Phase 3: "Data-First" Prop Interface Lock-in**
  - Inserted Phase 0 TS Interface extraction into generator pipeline.
- [x] **Phase 4: Semantic UI Token Enforcement**
  - Mapped W3C tokens to discrete Tailwind utility semantics instead of variables injection.
- [x] **Phase 5: Self-Healing Compiler Loops (Error Feedback)**
  - Integrated `parseAndHeal` compiler guard into both Component and Storybook LLM rendering loops.
- [x] **Phase 6: Manifest Prompt Fortification**
  - Add specific behavioral usage instructions to Shadcn components in the manifest builder (e.g., proper Tabs linkage).
- [x] **Phase 7: Semantic TypeScript Verification**
  - Enhance `ast_guard.ts` to use TypeScript semantic diagnostics to catch undefined variables and structural errors before runtime.

---

## 1. The "Curated Sandbox + Dynamic Manifest" Approach

### The Objective
Instead of telling the LLM to "use Shadcn" (which leads to raw HTML hallucinations or invalid module imports), we will pre-install essential primitives into the sandbox template, map them at runtime, and inject the exact import syntax into the LLM system prompt. 

### Implementation Details
*   **Target Codebase:** `packages/cli/templates/react-sandbox/` and `packages/llm/src/scaffolding/manifest_builder.ts` (New module).
*   **Changes:**
    1.  Execute `npx shadcn-ui@latest add badge separator avatar tabs accordion` inside the CLI's `react-sandbox` directory.
    2.  Create `manifest_builder.ts` which exposes a `buildShadcnManifest(sandboxPath: string)` function. This function uses Node `fs` to read `src/components/ui/` and regex-matches `export function Component` or `export const Component` to build an injection string.
    3.  Modify `packages/llm/src/scaffolding/prompt_generator.ts` to prepend this manifest string.

### Deep Example
**Generated Manifest String injected into the Prompt:**
```typescript
# Available UI Menu
You MUST strictly use the following pre-installed Shadcn components. Do not hallucinate imports:
- import { Button, buttonVariants } from "@/components/ui/button";
- import { Card, CardHeader, CardFooter, CardTitle, CardContent } from "@/components/ui/card";
- import { Badge, badgeVariants } from "@/components/ui/badge";
```

### Testing & Regression
*   **Test:** Ensure `buildShadcnManifest` handles missing directories gracefully (returns empty string).
*   **Regression:** Run `npm run test` to verify old unit tests for `prompt_generator` are updated to expect the dynamic manifest injection argument.

---

## 2. Bifurcating Component and Storybook Generation

### The Objective
Prevent token output truncation by strictly splitting the execution of `Component.tsx` and `Component.stories.tsx` into sequential prompts.

### Implementation Details
*   **Target Codebase:** `packages/llm/src/scaffolding/scaffold_orchestrator.ts` (or equivalent master script defining the generation loop) and `packages/llm/src/ast_guard.ts`.
*   **Changes:**
    1.  Instead of asking for `[1] Component, [2] Stories` in `prompt_generator.ts`, create `generateComponentPrompt()` and `generateStoriesPrompt()`.
    2.  *Pass 1:* Request pure React component.
    3.  *Validation:* Pass output to `ast_guard.ts`.
    4.  *Pass 2:* Submit the successfully parsed `Component.tsx` string as *Context* to the LLM alongside the `generateStoriesPrompt()`.

### Deep Example
**Pass 1 (Component Request):**
```markdown
Generate the React component based on the attached JSON data. Output ONLY the Component.tsx file.
```

**Pass 2 (Stories Request):**
```markdown
Using this newly generated component string:
`import { Card } ... export const Hero = (props: HeroProps) => ...`
Generate a Storybook `.stories.tsx` file for this exact component. Expose all arguments properly.
```

### Testing & Regression
*   **Test:** Observe terminal outputs during execution—the file count written by the LLM should be exactly 1 per pass.
*   **Regression:** Ensure `ast_guard.ts` validation works on single-file payloads without crashing because it was "expecting two codeblocks."

---

## 3. "Data-First" Prop Interface Lock-in

### The Objective
Force the LLM to codify the Data Model *before* attempting to generate the DOM layout.

### Implementation Details
*   **Target Codebase:** `packages/llm/src/scaffolding/scaffold_orchestrator.ts`.
*   **Changes:**
    1.  Introduced as Phase 0 of a scaffold run: send the SQLite DB payload JSON to the LLM. 
    2.  *Prompt:* `Extract the required props for a React component representing this data. Output ONLY a Typescript Interface.`
    3.  Feed the interface into Pass 1 (Component Generation).

### Testing & Regression
*   **Test:** Verify the returned code block compiles as valid TS (`ts.createSourceFile`).
*   **Regression:** Verify existing generic layout components do not crash if the SQLite DB returns an empty JSON payload.

---

## 4. Semantic UI Token Enforcement

### The Objective
Guarantee the brand colors and typography align with the generated Vite template without manual global CSS patches.

### Implementation Details
*   **Target Codebase:** `packages/llm/src/scaffolding/prompt_generator.ts`.
*   **Changes:**
    1.  Read the `design_tokens.json` generated in Phase 4 of the pipeline.
    2.  Parse the tokens into absolute Tailwind utility instructions.
    3.  Inject into prompt: `"You must map layout colors strictly to these parsed theme tokens: { bg: 'bg-background', primary: 'bg-primary text-primary-foreground', muted: 'bg-muted' }."`

### Deep Example
Instead of the LLM generating:
`<div className="bg-white text-gray-800 p-4 shadow">`
It is forced to output:
`<div className="bg-background text-foreground p-4 shadow">`

### Testing & Regression
*   **Test:** Run a full scaffold phase, boot the generated React sandbox (`output/<domain>/`), run `npm run storybook`, and visually confirm component colors map to the injected `globals.css` CSS variables seamlessly. 

---

## 5. Self-Healing Compiler Loops (Error Feedback)

### The Objective
When `ast_guard.ts` fails to parse a generated file (due to syntax issues or invalid Markdown formatting), automatically feed the error back into the LLM instead of crashing the pipeline.

### Implementation Details
*   **Target Codebase:** `packages/llm/src/llm/ollama_client.ts` or `scaffold_orchestrator.ts`.
*   **Changes:**
    1. Wrap the LLM API call in a `try...catch` loop bounded by a `MAX_RETRIES = 3` counter.
    2. If `ast_guard` throws `SyntaxError`, capture the `error.message`.
    3. Push back to the conversation array: `{ role: 'user', content: 'Your code failed to compile. Error: <error.message>. Fix the syntax and return the full file block.' }`.

### Deep Example
`AST_GUARD Error: Unterminated JSX contents. (Line 45)` -> Prompts LLM automatically to append the missing `</div>`.

### Testing & Regression
*   **Test:** Intentionally mock a response from the LLM with a trailing `}` omitted. Ensure the orchestrator catches it, retries, and records the event in logs.
*   **Ensure Success:** Log metrics on "retries used" to monitor whether this hides deeper prompt degradation issues over time.


## 6. Manifest Prompt Fortification

### The Objective
Address functional errors where components parse successfully but are wired incorrectly (like Shadcn Tabs missing a default value or mismatched trigger/content values) by appending usage rules sequentially with the primitive exports.

### Implementation Details
*   **Target Codebase:** `packages/llm/src/scaffolding/manifest_builder.ts`.
*   **Changes:**
    1.  Add specific usage hints for complex primitives like `<Tabs>`, `<Accordion>`, `<Dialog>`.
    2.  Ensure these rules are passed back directly in the LLM System Prompt.

---

## 7. Semantic TypeScript Verification

### The Objective
Catch runtime ReferenceErrors (like `logol is not defined`) and prop mismatch hallucinations *before* writing the payload out, expanding the AST guard from purely syntactic checks to semantic diagnostics.

### Implementation Details
*   **Target Codebase:** `packages/llm/src/scaffolding/ast_guard.ts`.
*   **Changes:**
    1.  Implement a `ts.Program` in memory that evaluates the generated React TSX payload.
    2.  Query `ts.getPreEmitDiagnostics(program)` or `getSemanticDiagnostics()`.
    3.  Filter for critical semantic failures (error code 2304) and route them into the `parseAndHeal` fallback sequence.
