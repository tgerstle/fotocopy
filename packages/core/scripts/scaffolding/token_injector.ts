import * as fs from "fs/promises";
import * as path from "path";
import { SemanticTokens } from "../crawler/token_extractor";

/**
 * Injects dynamically extracted semantic tokens into the react-sandbox globals.css file.
 * We want to make sure the tokens correctly override defaults in the `:root` pseudo-class.
 */
export async function injectTokensToCSS(
  cssFilePath: string,
  tokens: SemanticTokens,
): Promise<void> {
  const cssContent = await fs.readFile(cssFilePath, "utf-8");

  // Create the string of CSS variables to inject
  const injectedVars = Object.entries(tokens.cssVariables)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");

  const injectionBlock = `
  /* --- FOTOCOPY DYNAMIC TOKENS --- */
${injectedVars}
  /* ------------------------------- */
`;

  // We find the `:root {` block and append our tokens inside it.
  const rootIndex = cssContent.indexOf(":root {");
  if (rootIndex !== -1) {
    const output = cssContent.replace(/:root\s*\{/, `:root {${injectionBlock}`);
    await fs.writeFile(cssFilePath, output, "utf-8");
  } else {
    // If no :root block, we append it to the end
    await fs.writeFile(
      cssFilePath,
      cssContent + `\n:root {${injectionBlock}}\n`,
      "utf-8",
    );
  }
}
