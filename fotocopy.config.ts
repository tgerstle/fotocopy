import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const fotocopyConfig = {
  testTargetUrl: process.env.TEST_TARGET_URL || "https://css-snacks.com",

  // URL Discovery Intake
  staticUrlList: [
    "https://www.css-snacks.com/",
    "https://www.css-snacks.com/guide/system-fonts-what-they-are-and-when-to-use-them/",
  ],
  sitemapUrl: "https://www.css-snacks.com/sitemap-index.xml",
  intakeCsvPath: path.resolve(__dirname, "data/legacy-urls.csv"),

  // Output Directories
  outputDir: path.resolve(__dirname, "output/live_capture"),

  // LLM Configuration
  llm: {
    model: "gemma4:26b",
    endpoint: "http://localhost:11434/api/generate",
    temperature: 0.1,
    timeout: 1200000, // 20 minutes to accommodate heavy local models
    // Feed component prompts back to Ollama to generate physical .tsx files
    autoGenerateComponents: true,
  },

  // Plugins & Escape Hatches
  plugins: [
    { matcher: "iframe[src*='youtube.com']", tag: "PLUGIN:YOUTUBE" },
    { matcher: "form.hubspot-form", tag: "PLUGIN:HUBSPOT" },
  ],
};
