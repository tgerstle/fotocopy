import * as path from "path";

export const fotocopyConfig = {
  // Benchmark target for test suites.
  // Change this to your own site or localhost target before sharing/running!
  testTargetUrl: process.env.TEST_TARGET_URL || "https://css-snacks.com",

  // URL Discovery Intake List
  intakeCsvPath: path.resolve(__dirname, "demo-pipeline/data/legacy-urls.csv"),

  // Output Directories
  outputDir: path.resolve(__dirname, "demo-pipeline/output/live_capture"),
};
