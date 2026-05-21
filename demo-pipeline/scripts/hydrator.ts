import * as fs from "fs/promises";
import * as cheerio from "cheerio";
import { LLMPageSchema } from "../schemas/llm";
import { DesignTokensSchema } from "../schemas/tokens";
import { CMSPageSchema, CMSPageData } from "../schemas/cms";

export async function hydrate(
  domPath: string,
  llmOutputPath: string,
  tokensPath: string,
): Promise<CMSPageData> {
  const rawDom = await fs.readFile(domPath, "utf-8");
  const llmOutputRaw = JSON.parse(await fs.readFile(llmOutputPath, "utf-8"));
  const tokensRaw = JSON.parse(await fs.readFile(tokensPath, "utf-8"));

  // Validate inputs
  const llmData = LLMPageSchema.parse(llmOutputRaw);
  const tokens = DesignTokensSchema.parse(tokensRaw);

  const $ = cheerio.load(rawDom);

  const resolvedBlocks = llmData.blocks.map((block) => {
    const resolvedData: Record<string, any> = {};

    for (const [propName, nodeId] of Object.entries(block.mappings)) {
      const fieldName = propName.replace("NodeId", "");
      const el = $(`[data-awa-id="${nodeId}"]`);

      if (el.length === 0) {
        console.warn(
          `Warning: Node ID ${nodeId} not found in DOM for property ${propName}`,
        );
        continue;
      }

      if (el.is("img")) {
        resolvedData[fieldName] = el.attr("src");
      } else {
        resolvedData[fieldName] = el.text().trim();
      }
    }

    resolvedData.designTokens = tokens;

    return {
      blockType: block.inferredBlockType,
      data: resolvedData,
    };
  });

  const output = {
    title: "Home Page",
    slug: llmData.page_id.replace("_page", ""),
    layout: resolvedBlocks,
  };

  // Validate final output strictly against CMS API schema
  return CMSPageSchema.parse(output);
}

// If run directly from CLI
if (require.main === module) {
  (async () => {
    try {
      const data = await hydrate(
        "./mock_capture/01_raw_dom.html",
        "./mock_llm/02_llm_output.json",
        "./mock_capture/01_design_tokens.json",
      );
      await fs.writeFile(
        "./output/03_cms_ready.json",
        JSON.stringify(data, null, 2),
      );
      console.log("Successfully hydrated 03_cms_ready.json");
    } catch (e) {
      console.error("Hydration failed:", e);
    }
  })();
}
