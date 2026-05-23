import * as esbuild from "esbuild";

async function main() {
  const code = "const activeTab = 'home'; console.log(`tab-${activeTab.replace(/\\s+/lag, '-').toLowerCase()}`);";
  try {
    await esbuild.transform(code, { loader: 'tsx' });
    console.log("No syntax error found.");
  } catch (e: any) {
    if (e.errors && e.errors.length > 0) {
      console.log(`Esbuild Error: ${e.errors[0].text} at line ${e.errors[0].location?.line}`);
    } else {
      console.log("Caught syntax error:", e.message);
    }
  }
}

main();
