# Phase 4, Step 1: Semantic Design Token Mapping

In the updated architecture, we do not rely on the LLM to invent design tokens or blindly guess hex codes. Instead, Phase 2.3's `token_extractor.ts` provides a mathematically generated CSS dictionary natively aligned with the `shadcn/ui` ecosystem. Phase 4 maps these into our Sandbox.

## 1. The Strict Semantic Token Schema

To put as little strain on the generative LLM as possible, we supply it with a highly constrained, predefined list of semantic variables. The extractor parses the wild legacy CSS and quantizes it into exactly these slots:

### Base Variables (Mapped to Tailwind Utility Classes)

- **Colors (RGB space):**
  - `--background` / `--foreground` (Global body)
  - `--card` / `--card-foreground` (Cards)
  - `--popover` / `--popover-foreground` (Modals/Popovers)
  - `--primary` / `--primary-foreground` (Primary buttons, active states)
  - `--secondary` / `--secondary-foreground` (Secondary actions)
  - `--muted` / `--muted-foreground` (Disabled or subtle backgrounds)
  - `--accent` / `--accent-foreground` (Hover states)
  - `--destructive` / `--destructive-foreground` (Error states)
  - `--border`, `--input`, `--ring` (Layout lines and focus rings)
- **Typography:**
  - `--font-sans` (Default body text, e.g., 'Inter', sans-serif)
  - `--font-heading` (Display headers, e.g., 'Cal Sans', sans-serif)
  - `--font-mono` (Monospace components)
- **Geometry & Spacing:**
  - `--radius` (Global component corner rounding, e.g. `0.5rem`)
  - `--container-padding` (Standardized page edge padding, e.g. `2rem`)
  - `--section-spacing` (Vertical gap between major horizontal bands, e.g. `4rem` or `6rem`)
  - _Note on Spacing Best Practices:_ We **do not** use step variables like `--pad-1` or `--space-s`. Re-inventing the spacing scale as CSS variables defeats the purpose of Tailwind and confuses the LLM. Instead, for inner component margins/paddings, the extraction engine rounds physical pixels (e.g. `17px` padding inside a button) directly to native Tailwind utility steps (e.g., `p-4`, `gap-2`). The LLM is heavily trained on standard Tailwind, so letting it use `p-4` natively relies on its existing knowledge and reduces prompt bloat.

## 2. Integration into Component Scaffolding

When generating the React frontend, these semantic tokens are used in two ways:

1.  **Global Injection (`globals.css`)**: The parsed RGB variables are physically written into the `/src/index.css` or `globals.css` of the `test-sandbox` testbed.
2.  **Explicit Context Prompting**: We inject the literal CSS token names directly into the LLM system prompt. The LLM is explicitly barred from generating arbitrary hex values. It is told:
    _"You are styling a shadcn/ui component. You MUST ONLY use the semantic prefix tailwind classes: `bg-primary`, `text-muted-foreground`, `border-border`, `rounded-[var(--radius)]`. Do NOT write `bg-[#E24A4A]`."_

By drastically narrowing the choices the LLM has to make regarding colors, cognitive strain drops significantly, preventing syntax hallucinations and ensuring 100% theme consistency across generated primitives.
