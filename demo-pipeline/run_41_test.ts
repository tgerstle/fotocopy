import { generateManifests } from "./scripts/scaffolding/manifest_generator";
import { downloadAssetsLocally } from "./scripts/assets/manager";
import * as path from "path";
import { fotocopyConfig } from "../fotocopy.config";

async function runTest() {
  const chunksDir = path.join(__dirname, "output/chunks");
  const rawMapPath = path.join(__dirname, "output/hydration/llm_raw_map.json");
  const liveCaptureDir = fotocopyConfig.outputDir;
  const outputManifestsDir = path.join(__dirname, "output/manifests");
  const publicAssetsDir = path.join(__dirname, "../demo-frontend/public/assets");

  console.log("== 1. Generating Manifests ==");
  await generateManifests(chunksDir, rawMapPath, liveCaptureDir, outputManifestsDir);
  
  console.log("\\n== 2. Running Asset Manager ==");
  await downloadAssetsLocally(outputManifestsDir, publicAssetsDir, fotocopyConfig.testTargetUrl);
}

runTest().catch(console.error);
