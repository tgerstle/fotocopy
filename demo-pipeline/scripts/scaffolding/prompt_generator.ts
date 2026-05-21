import * as fs from "fs/promises";
import * as path from "path";
import { ComponentsManifest } from "../llm/consolidator";

export async function generatePrompts(
  manifestPath: string,
  tokensPath: string,
  outputDir: string
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
    
    const promptContent = `# Context

You are building a Next.js Server Component that acts as a UI block for Payload CMS.
The target block is: \`${componentName}\`

# Strict TypeScript Interface

The component MUST accept exactly these props derived directly from the consolidated schema shape:
\`\`\`json
${schemaString}
\`\`\`

# Design System

Use Tailwind CSS classes exclusively. Here are the W3C Design Tokens extracted from the site:
\`\`\`json
${tokensString}
\`\`\`

# Instructions

1. Output \`${componentName}.tsx\`.
2. Do not use client hooks (\`useState\`, \`useEffect\`) unless explicitly necessary.
3. Import \`next/image\` for the backgroundImage.
4. Style the component matching standard modern UI practices, using the W3C tokens provided.
`;

    const outPath = path.join(outputDir, `${componentName}.prompt.md`);
    await fs.writeFile(outPath, promptContent);
    generatedFiles.push(outPath);
  }

  console.log(`Generated ${generatedFiles.length} prompt templates in ${outputDir}`);
  return generatedFiles;
}

if (require.main === module) {
  (async () => {
    try {
      await generatePrompts(
        path.join(__dirname, "../../fotocopy.components.json"),
        path.join(__dirname, "../../output/live_capture/01_design_tokens.json"),
        path.join(__dirname, "../../output/prompts")
      );
    } catch (e) {
      console.error("Prompt generation failed:", e);
    }
  })();
}
