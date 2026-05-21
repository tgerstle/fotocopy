import { fotocopyConfig } from '../../../fotocopy.config';
import { generateCode } from '../llm/ollama_client';
import * as fs from "fs/promises";
import * as path from "path";
import { GlobalIntent } from "../llm/globals_classifier";

export async function generateGlobalPrompts(
  originalManifestPath: string,
  manifestPath: string,
  tokensPath: string,
  outputDir: string
): Promise<string[]> {
  const manifestRaw = await fs.readFile(manifestPath, "utf-8");
  const manifest: Record<string, GlobalIntent> = JSON.parse(manifestRaw);
  const originalManifestRaw = await fs.readFile(originalManifestPath, "utf-8");
  const originalManifest = JSON.parse(originalManifestRaw);

  const tokensRaw = await fs.readFile(tokensPath, "utf-8");
  const tokensString = JSON.stringify(JSON.parse(tokensRaw), null, 2);

  await fs.mkdir(outputDir, { recursive: true });

  const generatedFiles: string[] = [];

  const deduplicatedTypes = new Set<string>();
  
  for (const [hash, def] of Object.entries(manifest)) {
    let type = def.inferredBlockType;
    type = type.replace(/[\'\":,{}].*/g, "").trim();
    type = type.replace(/[^a-zA-Z0-9_-]/g, "");
    if (!type || type === "Unknown" || type === "N/A") continue;
    
    // Normalize to prevent duplicates of "SiteHeader"
    if (deduplicatedTypes.has(type)) continue;
    deduplicatedTypes.add(type);
    
    const promptContent = `# Context

You are building a Next.js Server Component that acts as a global UI Singleton Shell block for Payload CMS.
The target block is: \`${type}\`\n\n### Reference Footprint HTML\n\`\`\`html\n${originalManifest.elementsToRemove[hash] ? originalManifest.elementsToRemove[hash].join('\n') : 'N/A'}\n\`\`\`\n\n### Reference Footprint HTML\n\`\`\`html\n${originalManifest.elementsToRemove[hash] ? originalManifest.elementsToRemove[hash].join('\n') : 'N/A'}\n\`\`\`

# Architecture

Since this is a Singleton Shell block (like a Header, Footer, or Navigation), it MUST accept \`children?: React.ReactNode\` as it will wrap page elements inside Next.js layouts.

# Design System

Use Tailwind CSS classes exclusively. Here are the W3C Design Tokens extracted from the site:
\`\`\`json
${tokensString}
\`\`\`

# Layout Best Practices (Skills)
- Global layout components like Navigations and Footers must be absolute semantics: \`<nav>\`, \`<header>\`, \`<footer>\`.
- Design for Accessibility (A11y): Include "Skip to Content" links where applicable, ensure contrast.
- Ensure the \`children\` prop is safely wrapped in a primary layout container (e.g., \`<main>\`).
- Use the \`lucide-react\` library for icons if standard icons are missing or required.

# Instructions

1. Output \`${type}.tsx\`.
2. Do not use client hooks (\`useState\`, \`useEffect\`) unless explicitly necessary for mobile menus or interactions.
3. Incorporate the \`children\` prop properly where appropriate.
4. Style the component matching standard modern UI practices, using the W3C tokens provided.
5. STRICT TAILWIND RULE: DO NOT use arbitrary hex codes or hardcoded colors like \`bg-[#2F345F]\`. You MUST USE semantic Tailwind variables mapped to the tokens provided above (e.g. \`bg-[var(--color-bluedark)]\`). Your output must be fully themeable.
`;


    const outPath = path.join(outputDir, `${type}.prompt.md`);
    await fs.writeFile(outPath, promptContent);
    generatedFiles.push(outPath);

    if (fotocopyConfig.llm.autoGenerateComponents) {
      console.log(`Autoscaffolding global layout component: ${type}.tsx via LLM...`);
      try {
        const componentCode = await generateCode(promptContent, fotocopyConfig.llm);
        const componentsDir = path.resolve(__dirname, '../../../demo-frontend/src/components/globals');
        await fs.mkdir(componentsDir, { recursive: true });
        await fs.writeFile(path.join(componentsDir, `${type}.tsx`), componentCode);
      } catch (err) {
        console.error(`Failed to generate code for ${type}`, err);
      }
    }

  }

  console.log(`Generated ${generatedFiles.length} global prompt templates in ${outputDir}`);
  return generatedFiles;
}
