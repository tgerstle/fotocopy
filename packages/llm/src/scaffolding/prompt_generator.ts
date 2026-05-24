import { getConfig } from "@fotocopy/engine";
import { SemanticTokens } from "@fotocopy/engine";
import { parseAndHeal } from "./ast_guard";
import { PipelineError } from "@fotocopy/engine";

export interface OrchestrationTask {
  name: string;
  type: "primitive" | "orchestrator";
}

export interface DAGStrategyResult {
  tasks: OrchestrationTask[];
  systemPrompt: string;
}

export async function generateMapReduceStrategy(
  blueprint: { name: string; schema: any },
  semanticTokens: SemanticTokens,
  llmAnalyzer: (
    blueprint: any,
  ) => Promise<{ primitives: string[]; orchestrator: string }>,
): Promise<DAGStrategyResult> {
  // Phase 1: Call the fast small LLM purely to map out the strategy (DAG graph creation)
  const analysis = await llmAnalyzer(blueprint);

  const tasks: OrchestrationTask[] = [];

  // Add primitives first (Mappers)
  for (const p of analysis.primitives) {
    tasks.push({ name: p, type: "primitive" });
  }

  // Add the orchestrator last (Reducer)
  tasks.push({ name: analysis.orchestrator, type: "orchestrator" });

  // Phase 2: Build the static System Prompt combining the strict semantic tokens
  const tokenString = Object.entries(semanticTokens.cssVariables)
    .map(([key, val]) => `${key}: ${val};`)
    .join("\n");

  const systemPrompt = `
You are a React developer strictly obeying Shadcn architecture.
You must use these injected theme variables strictly rather than inventing hex colors:
${tokenString}
`;

  return {
    tasks,
    systemPrompt,
  };
}
import { generateCode } from "../llm/ollama_client";
import * as fs from "fs/promises";
import * as path from "path";
import { ComponentsManifest } from "../llm/consolidator";

export async function generatePrompts(
  manifestPath: string,
  tokensPath: string,
  outputDir: string,
  sampleDataPayload?: Record<string, any>, // Accept real DB hydrated content
  errorsArg?: PipelineError[],
): Promise<string[]> {
  const manifestRaw = await fs.readFile(manifestPath, "utf-8");
  const manifest: ComponentsManifest = JSON.parse(manifestRaw);

  const tokensRaw = await fs.readFile(tokensPath, "utf-8");
  // Keep tokens as string for injection
  const tokensString = JSON.stringify(JSON.parse(tokensRaw), null, 2);

  await fs.mkdir(outputDir, { recursive: true });

  const generatedFiles: string[] = [];

  for (const [componentName, def] of Object.entries(manifest)) {
    const schemaString = JSON.stringify(def.schema, null, 2);

    // Find representative sample data for exactly this component block type if provided
    const componentSampleData = sampleDataPayload
      ? sampleDataPayload[componentName]
      : null;
    const sampleDataString = componentSampleData
      ? `\n# Hydrated Mock Data (From Database)\nUse this exact data for the Storybook \`args\` so it renders realistically:\n\`\`\`json\n${JSON.stringify(componentSampleData, null, 2)}\n\`\`\`\n`
      : "";

    const promptContent = `# Context

You are building a standard React 19 Component that acts as a UI block.
The target block is: \`${componentName}\`

# Strict TypeScript Interface

The component MUST accept exactly these props derived directly from the consolidated schema shape:
\`\`\`json
${schemaString}
\`\`\`${sampleDataString}
# Design System

Use Tailwind CSS classes exclusively. Here are the W3C Design Tokens extracted from the site:
\`\`\`json
${tokensString}
\`\`\`

# Component Best Practices (Skills)
- Use pure standard React semantic HTML semantics (semantic \`<section>\`, \`<article>\`, \`<aside>\`, \`<nav>\`).
- Do NOT use Next.js specific components like \`next/image\`. Use standard HTML \`<img />\` tags.
- Design for Accessibility (A11y): Include \`aria-labels\`, use properly nesting \`h1-h6\` tags.
- Design using standard **shadcn/ui** concepts. Format the props and structure using conceptual primitives like \`Button\`, \`Card\`, \`Sheet\`, \`Dialog\`, \`Label\`, \`Input\` where appropriate for form and function.
- Consider empty states or optional props (e.g. \`{subtitle && <p>{subtitle}</p>}\`).
- You MUST rely on the \`lucide-react\` library for icons (e.g., \`import { ArrowRight } from "lucide-react";\`). However, do NOT import brand icons (e.g. Github, Twitter, Linkedin) from lucide-react, as they have been removed. Use purely semantic HTML text fallbacks for social icons. Do NOT output standard \`<svg>\` blob code.

# State & Data Coupling (CRITICAL)
- DO NOT inject complex application state hooks (\`useState\`, \`useEffect\`) if the component appears to be highly stateful like a "Search Results Grid", "Live Cart", or "Dynamic Filter".
- Instead, treat the block as a "Dumb Component" relying entirely on explicitly defined \`props\` (derived from the schema).
- Example: If a component requires search results or dynamic data, define them entirely through the Props Interface. The component should be visually complete but entirely decoupled from live application data fetching.

# Instructions

1. Output exactly two Markdown code blocks formatted like:
   \`\`\`tsx
   // your code here
   \`\`\`
2. In the first code block, output \`${componentName}.tsx\`. Do not use client hooks (\`useState\`, \`useEffect\`) unless explicitly necessary for things like toggles.
3. In the second code block, output a perfectly valid Storybook stories file named \`${componentName}.stories.tsx\`. Embed the provided JSON payload (if available) into the \`args\`.
4. Style the component matching standard modern UI practices, using the W3C tokens provided.
5. STRICT TAILWIND RULE: DO NOT use arbitrary hex codes or hardcoded colors like \`bg-[#2F345F]\`. You MUST USE semantic Tailwind variables mapped to the tokens provided above (e.g. \`bg-[var(--color-bluedark)]\`). Your output must be fully themeable.
`;

    const outPath = path.join(outputDir, `${componentName}.prompt.md`);
    await fs.writeFile(outPath, promptContent);
    generatedFiles.push(outPath);

    // Provide the component back to the LLM if config is opted in
    if (getConfig().llm?.autoGenerateComponents) {
      console.log(`Autoscaffolding component: ${componentName}.tsx via LLM...`);
      try {
        const generation = await generateCode(promptContent, getConfig().llm);

        if (generation.component) {
          // AST reflection guard
          const healedComponent = await parseAndHeal(
            generation.component,
            async (code, error) => {
              console.log(
                `[AST Guard] Reflection healing needed for ${componentName}: ${error}`,
              );
              const reflectPrompt = `The following React code has a syntax error: ${error}\n\nCode:\n\`\`\`tsx\n${code}\n\`\`\`\nFix it and output ONLY the valid tsx block.`;
              const retryGen = await generateCode(
                reflectPrompt,
                getConfig().llm,
              );
              return retryGen.component;
            },
          );

          if (healedComponent.success && healedComponent.code) {
            const sandboxDir = path.resolve(outputDir, "../../src/components");
            await fs.mkdir(sandboxDir, { recursive: true });

            await fs.writeFile(
              path.join(sandboxDir, `${componentName}.tsx`),
              healedComponent.code,
            );

            if (generation.story) {
              await fs.writeFile(
                path.join(sandboxDir, `${componentName}.stories.tsx`),
                generation.story,
              );
            }
          } else {
            console.error(
              `[AST Guard] Failed to heal ${componentName} after retries.`,
            );
            if (errorsArg) {
              errorsArg.push({
                phase: "SCAFFOLD_AST_GUARD",
                url: `Component: ${componentName}`,
                error: "Failed to heal AST syntax error after retries.",
              });
            }
          }
        }
      } catch (err: any) {
        console.error(`Failed to generate code for ${componentName}`, err);
        if (errorsArg) {
          errorsArg.push({
            phase: "SCAFFOLD",
            url: `Component: ${componentName}`,
            error: err.message || String(err),
          });
        }
      }
    }
  }

  console.log(
    `Generated ${generatedFiles.length} prompt templates in ${outputDir}`,
  );
  return generatedFiles;
}

if (require.main === module) {
  (async () => {
    try {
      await generatePrompts(
        path.join(__dirname, "../../fotocopy.components.json"),
        path.join(__dirname, "../../output/live_capture/01_design_tokens.json"),
        path.join(__dirname, "../../output/prompts"),
      );
    } catch (e) {
      console.error("Prompt generation failed:", e);
    }
  })();
}
