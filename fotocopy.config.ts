import * as path from "path";

export const fotocopyConfig = {
  testTargetUrl: process.env.TEST_TARGET_URL || "https://css-snacks.com",

  // URL Discovery Intake
  staticUrlList: [
    "https://www.css-snacks.com/",
    "https://www.css-snacks.com/accessible-components/",
  ],
  sitemapUrl: "https://www.css-snacks.com/sitemap-index.xml",
  intakeCsvPath: path.resolve(__dirname, "demo-pipeline/data/legacy-urls.csv"),

  // Output Directories
  outputDir: path.resolve(__dirname, "demo-pipeline/output/live_capture"),

  // LLM Configuration
  llm: {
    model: "gemma4:26b",
    endpoint: "http://localhost:11434/api/generate",
    temperature: 0.1,
  },
};
