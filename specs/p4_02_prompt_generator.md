# Phase 4, Step 2: DAG Component Scaffolding & AST Guards

To maximize code quality and lower LLM processing strain, the Node Orchestrator executes code generation automatically using a **Directed Acyclic Graph (DAG)** flow combined with an aggressive syntactic safety net.

We do not generate massive monolithic files in a single pass. Instead, complexity is chunked.

## 1. The DAG Scaffolding Logic

**Goal:** Transform the LLM's classification blocks (e.g., `HeroBlockDataSchema`) into physical `.tsx` files utilizing `shadcn/ui` and our Semantic Design Tokens.

**Implementation Logic:**
Rather than asking for `Footer.tsx` directly:

1. **Map (Primitive Generation):** The planner prompts the LLM to output small primitive files (e.g. `SocialLink.tsx`). Since the scope is tiny, the model achieves a ~99% success rate without hallucination.
2. **Reduce (Parent Assembly):** The Orchestrator passes the completed Typescript interfaces of the primitives to the LLM and asks it to aggregate them into the final `FooterLayout.tsx`.

The System Prompt injected into these local models includes explicit anchors:

- Strict requirements to use `@/components/ui/...` paths.
- Mandatory enforcement of the Semantic Token Dictionary (e.g., `bg-primary`, `text-foreground`).
- Instructions banning `useEffect` or unneeded client logic unless explicitly mapped.

## 2. In-Memory Syntactic Guards (Self-Healing)

Because LLMs can still occasionally drop JSX brackets or misspell tags (e.g., `<rabutton>`):

1.  **AST Validation:** Before any `.tsx` text is written to the Sandbox disk, it is streamed into an AST Parser (like the TypeScript Compiler API).
2.  **Validation Catch:** If the parser throws a typical syntax error (`Expected corresponding JSX closing tag`), the script traps the exception.
3.  **Reflection Loop:** The Orchestrator calls the LLM _again_, attaching the exact error message and the broken code, instructing it: `"Fix this specific syntax error."`
4.  **Fallback Limits:** If the loop fails twice, the component evaluates as a generic `ErrorBoundary` wrapper to ensure Vite and Storybook never crash.

## 3. Hydrating Live Data into Storybook

Fotocopy connects the live legacy data directly into the newly generated React components so stakeholders can preview the migration identically to the live site.

**Implementation Logic:**
1. During Phase 3 (`hydrate()`), a strict JSON CMS payload is generated comprising the text, images, and links extracted from the live DOM. 
2. The orchestrator script (`pipeline_runner.ts`) parses this hydrated JSON from the `/fotocopy-metadata/hydration/` directory right before it calls `generatePrompts()`.
3. The Prompt Generator receives this payload and locates the mock content representing the specific target block.
4. The system prompt dynamically embeds this CMS data and commands the LLM to physically encode it as the `args` payload within the generated `.stories.tsx` file for Storybook.

## 4. The Sandbox Artifact

The final output is injected into `/test-sandbox/src/components`. Because all generated code ran the gauntlet of the AST Guard, was bound to pre-set tokens, and was hydrated with live JSON CMS data, a simple `npm run storybook` command successfully paints the local preview environment immediately.
