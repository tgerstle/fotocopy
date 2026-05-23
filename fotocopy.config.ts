import * as path from "path";

export const fotocopyConfig = {
  testTargetUrl: process.env.TEST_TARGET_URL || "https://css-snacks.com",

  // URL Discovery Intake
  staticUrlList: [
    "https://www.css-snacks.com/",
    "https://www.css-snacks.com/guide/system-fonts-what-they-are-and-when-to-use-them/",
  ],
  sitemapUrl: "https://www.css-snacks.com/sitemap-index.xml",
  intakeCsvPath: path.resolve(__dirname, "packages/core/data/legacy-urls.csv"),

  // Output Directories
  outputDir: path.resolve(__dirname, "packages/core/output/live_capture"),

  // LLM Configuration
  llm: {
    model: "gemma4:26b",
    endpoint: "http://localhost:11434/api/generate",
    temperature: 0.1,
    // Feed component prompts back to Ollama to generate physical .tsx files
    autoGenerateComponents: true,
  },

  // Plugins & Escape Hatches
  plugins: [
    { matcher: "iframe[src*='youtube.com']", tag: "PLUGIN:YOUTUBE" },
    { matcher: "form.hubspot-form", tag: "PLUGIN:HUBSPOT" },
  ],
};
