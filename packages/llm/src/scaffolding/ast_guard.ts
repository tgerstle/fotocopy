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

function getSemanticErrors(code: string): string | null {
  const filename = "VirtualComponent.tsx";
  const sourceFile = ts.createSourceFile(
    filename,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  const defaultCompilerHost = ts.createCompilerHost({});
  const customCompilerHost: ts.CompilerHost = {
    ...defaultCompilerHost,
    getSourceFile: (name, languageVersion) => {
      if (name === filename) return sourceFile;
      return defaultCompilerHost.getSourceFile(name, languageVersion);
    },
    writeFile: () => {},
    useCaseSensitiveFileNames: () => false,
    getCanonicalFileName: (filename) => filename,
    getCurrentDirectory: () => "",
    getNewLine: () => "\n",
    getDirectories: () => [],
    fileExists: (name) =>
      name === filename || defaultCompilerHost.fileExists(name),
    readFile: (name) =>
      name === filename ? code : defaultCompilerHost.readFile(name),
  };

  const program = ts.createProgram(
    [filename],
    {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      noEmit: true,
      skipLibCheck: true, // Speeds up the mock compilation
    },
    customCompilerHost,
  );

  const diagnostics = ts.getPreEmitDiagnostics(program);
  // Filter for structural and semantic reference errors
  // 2304 is 'Cannot find name x', 2552 is 'Cannot find name x. Did you mean y?', 2322 is 'Type is not assignable to type'
  const targetErrors = diagnostics.filter(
    (d) => d.code === 2304 || d.code === 2552,
  );

  if (targetErrors.length > 0) {
    const errorText = targetErrors
      .map((d) => {
        let text = d.messageText;
        if (typeof text !== "string") {
          text = text.messageText;
        }
        return text;
      })
      .join(" | ");

    return `Semantic TS Error: ${errorText}`;
  }

  return null;
}

async function checkSyntax(code: string): Promise<string | null> {
  if (typeof code !== "string") {
    return "Syntax Error: Code is undefined or not a string.";
  }

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
    await esbuild.transform(code, { loader: "tsx" });
  } catch (e: any) {
    if (e.errors && e.errors.length > 0) {
      const err = e.errors[0];
      const line = err.location?.line;
      return `Syntax Error (esbuild): ${err.text} at line ${line}`;
    }
    return `Syntax Error: ${e.message}`;
  }

  // 3. TS Semantic Check
  const semanticError = getSemanticErrors(code);
  if (semanticError) {
    return semanticError;
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
