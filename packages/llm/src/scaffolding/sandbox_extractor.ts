import * as fs from "fs";
import * as path from "path";

import { execSync } from "child_process";

export function extractSandboxTemplate(
  templateSrcPath: string,
  targetOutputPath: string,
): boolean {
  if (!fs.existsSync(templateSrcPath)) {
    console.error(`Template source not found at: ${templateSrcPath}`);
    return false;
  }

  // Prevents overwriting the system core by validating target isn't inside packages/core
  if (
    path.resolve(targetOutputPath).includes(path.resolve(__dirname, "../..")) &&
    !path.resolve(targetOutputPath).includes("/tests/")
  ) {
    console.error(
      `Cannot extract sandbox into core source tree: ${targetOutputPath}`,
    );
    return false;
  }

  try {
    fs.cpSync(templateSrcPath, targetOutputPath, {
      recursive: true,
      force: true, // We will forcefully overwrite sandbox contents
      filter: (src) => {
        const isNodeModules = src.includes("node_modules");
        const isNextCache = src.includes(".next");
        return !isNodeModules && !isNextCache;
      },
    });

    // Update package.json name to reflect the target domain
    const targetDomain = path.basename(path.resolve(targetOutputPath));
    const packageJsonPath = path.join(targetOutputPath, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      pkg.name = `fotocopy-sandbox-${targetDomain.replace(/[^a-zA-Z0-9-]/g, "-")}`;
      fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
    }

    console.log(`\n📦 Installing Sandbox Dependencies...`);
    execSync("pnpm install --no-frozen-lockfile", {
      cwd: targetOutputPath,
      stdio: "inherit",
    });

    return true;
  } catch (err: any) {
    console.error(`Error extracting sandbox: ${err.message}`);
    return false;
  }
}
