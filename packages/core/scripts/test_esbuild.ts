import * as esbuild from "esbuild";

async function main() {
  const code = "const activeTab = 'home'; console.log(`tab-${activeTab.replace(/\\s+/lag, '-').toLowerCase()}`);";
  try {
    await esbuild.transform(code, { loader: 'tsx' });
    console.log("No syntax error found.");
  } catch (e: any) {
    console.log("Caught syntax error:", e.message);
  }
}

main();
