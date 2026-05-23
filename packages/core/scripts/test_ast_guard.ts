import { parseAndHeal } from "./scaffolding/ast_guard";

async function main() {
  const badCode = "const activeTab = 'home'; console.log(`tab-${activeTab.replace(/\\s+/lag, '-').toLowerCase()}`);";
  
  const result = await parseAndHeal(badCode, async (code, error) => {
    console.log("Mock LLM healing triggered by error:", error);
    return "const activeTab = 'home'; console.log(`tab-${activeTab.replace(/\\s+/g, '-').toLowerCase()}`);";
  });

  console.log("Healing result:", result.success ? "Success" : "Failed", result);
}

main();
