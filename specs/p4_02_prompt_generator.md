# Phase 4, Step 2: Automated Prompts (Copilot Scaffolding)

To maximize code quality and lower developer overhead, the Node Orchestrator automatically prepares fully-qualified context files for GitHub Copilot.

We do not trust Gemma (our extraction LLM) to write React code. Instead, we use Gemma for data, and Copilot for code.

## 1. The Prompt Generator Script

**Goal:** For every unique block type defined in the Zod schemas (e.g., `HeroBlockDataSchema`), construct a `.prompt.md` file that guides GitHub Copilot perfectly.

**Implementation Logic:**
The Orchestrator reads the newly generated `fotocopy.components.json` (from Phase 3 Consolidation) and iterates its keys. When it finds a component definition, it writes to `prompts/Hero.prompt.md`:

```markdown
# Context

You are building a Next.js Server Component that acts as a UI block for Payload CMS.
The target block is: `Hero`

# Strict TypeScript Interface

The component MUST accept exactly these props derived directly from the consolidated schema shape:
{INJECT_COMPONENT_SCHEMA_HERE}

# Design System

Use Tailwind CSS classes exclusively. Here are the W3C Design Tokens extracted from the site:
{INJECT_W3C_TOKENS_HERE}

# Instructions

1. Output `Hero.tsx`.
2. Do not use client hooks (`useState`, `useEffect`) unless explicitly necessary.
3. Import `next/image` for the backgroundImage.
4. Style the component matching standard modern UI practices, using the W3C tokens provided.
```

## 2. The Developer Handoff

1. The Prompt Generator outputs `.prompt.md` files for every block found in `fotocopy.components.json`.
2. The developer opens VS Code.
3. The developer executes the prompt inside Copilot Chat (or uses `#file` references).
4. Copilot scaffolds `Hero.tsx`.
5. The developer moves it into `/components/blocks/Hero.tsx` and executes the Tracer Bullet visual tests to confirm.
