import * as fs from "fs/promises";
import * as path from "path";

const COMPONENT_RULES: Record<string, string> = {
  tabs: 'Rules for Tabs: You MUST wrap the entire block in `<Tabs defaultValue="someValue">`. Every `<TabsTrigger value="x">` MUST have a corresponding `<TabsContent value="x">`.',
  accordion:
    'Rules for Accordion: Wrap items in `<Accordion type="single" collapsible>`. Use `<AccordionItem value="item-1">` with matching `<AccordionTrigger>` and `<AccordionContent>`.',
  dialog:
    "Rules for Dialog: Wrap content in `<DialogContent>`. Use `<DialogTrigger asChild>` if wrapping a button.",
};

/**
 * Reads the Shadcn components from the provided sandbox sandbox `src/components/ui`
 * and dynamically builds a manifest string to be injected into the LLM system prompt.
 *
 * Target output format:
 * - import { Button, buttonVariants } from "@/components/ui/button";
 */
export async function buildShadcnManifest(
  sandboxPath: string,
): Promise<string> {
  const uiPath = path.join(sandboxPath, "src", "components", "ui");

  try {
    const files = await fs.readdir(uiPath);

    if (files.length === 0) {
      return "";
    }

    const imports: string[] = [];
    const usageRules: string[] = [];

    for (const file of files) {
      if (!file.endsWith(".tsx")) continue;

      const filePath = path.join(uiPath, file);
      const content = await fs.readFile(filePath, "utf-8");

      // Naive regex to pick up `export function Component` or `export const Component`
      const exportRegex =
        /export\s+(?:const|function|interface|type)\s+([a-zA-Z0-9_]+)/g;

      const exportedMatches = [];
      let match;
      while ((match = exportRegex.exec(content)) !== null) {
        // ignore purely internal shadcn utilities or non-capitalized helpers unless it's variants
        const name = match[1];
        if (name.toLowerCase().includes("context")) continue;
        exportedMatches.push(name);
      }

      // Look for variants exported from CVA
      const variantRegex = /export\s+const\s+([a-zA-Z0-9_]+Variants)\s*=/g;
      while ((match = variantRegex.exec(content)) !== null) {
        if (!exportedMatches.includes(match[1])) {
          exportedMatches.push(match[1]);
        }
      }

      if (exportedMatches.length > 0) {
        const componentName = file.replace(".tsx", "");
        imports.push(
          `- import { ${exportedMatches.join(", ")} } from "@/components/ui/${componentName}";`,
        );

        if (COMPONENT_RULES[componentName]) {
          usageRules.push(`- ${COMPONENT_RULES[componentName]}`);
        }
      }
    }

    if (imports.length === 0) return "";

    const baseImports = [
      "# Available UI Menu",
      "You MUST strictly use the following pre-installed Shadcn components. Do not hallucinate imports:",
      ...imports,
    ].join("\n");

    let output = baseImports;
    if (usageRules.length > 0) {
      output += "\n\n# Specific Shadcn Usage Rules\n" + usageRules.join("\n");
    }
    return output;
  } catch (error: any) {
    // Graceful fallback if directory doesn't exist
    if (error.code === "ENOENT") {
      return "";
    }
    console.error("[ManifestBuilder] Error reading Shadcn components:", error);
    return "";
  }
}
