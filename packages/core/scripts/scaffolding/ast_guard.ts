import * as ts from "typescript";
import * as esbuild from "esbuild";

export interface AstHealResult {
  success: boolean;
  code?: string;
  error?: string;
}

export type LLMHealerFn = (
  brokenCode: string,
  errorMessage: string,
) => Promise<string>;

async function checkSyntax(code: string): Promise<string | null> {
  // 1. Typescript Compiler API Check (Good for basic parse diagnostics)
  const sourceFile = ts.createSourceFile(
    "Component.tsx",
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  const diagnostics = (sourceFile as any).parseDiagnostics || [];
  if (diagnostics.length > 0) {
    return (
      diagnostics[0].messageText?.toString() || "Syntax error detected in AST."
    );
  }

  // 2. Esbuild strict parser check (Good for invalid regex flags, etc.)
  try {
    await esbuild.transform(code, { loader: 'tsx' });
  } catch (e: any) {
    if (e.errors && e.errors.length > 0) {
      const err = e.errors[0];
      const line = err.location?.line;
      return `Syntax Error (esbuild): ${err.text} at line ${line}`;
    }
    return `Syntax Error: ${e.message}`;
  }

  return null; // Null means no errors
}

export async function parseAndHeal(
  code: string,
  healerFn: LLMHealerFn,
  maxRetries: number = 2,
): Promise<AstHealResult> {
  let currentCode = code;
  let attempts = 0;

  while (attempts <= maxRetries) {
    const errorMsg = await checkSyntax(currentCode);

    if (!errorMsg) {
      return { success: true, code: currentCode };
    }

    if (attempts === maxRetries) {
      return {
        success: false,
        error: `Syntax error persistence limit reached: ${errorMsg}`,
      };
    }

    // Invoke reflection healing loop
    currentCode = await healerFn(currentCode, errorMsg);
    attempts++;
  }

  return { success: false, error: "Failed to heal code" };
}
