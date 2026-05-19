import { chromium, Page } from "playwright";
import * as fs from "fs/promises";
import * as path from "path";

export interface CrawlOptions {
  url: string;
  outputDir: string;
}

// Phase 1, Step 2: Scenario System - Dismiss Modals/Cookies
async function handleScenarios(page: Page) {
  console.log(`Checking for cookie banners and modals...`);
  const interceptors = [
    ".CybotCookiebotDialogBodyButton", // Cookiebot
    "#onetrust-accept-btn-handler", // OneTrust
    ".js-cookie-consent-agree",
  ];

  for (const selector of interceptors) {
    try {
      const el = page.locator(selector);
      if (await el.isVisible({ timeout: 500 })) {
        console.log(`Triggering Scenario: Dismissing banner via ${selector}`);
        await el.click();
        await page.waitForTimeout(500); // Wait for transition out
      }
    } catch (e) {
      // Ignored: selector not found immediately
    }
  }
}

export async function crawlAndCapture({ url, outputDir }: CrawlOptions) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }, // Strict desktop viewport
  });
  const page = await context.newPage();

  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: "networkidle" });

  // Phase 1, Step 2
  await handleScenarios(page);

  // Phase 1, Step 3: Inject the DOM Parser
  console.log(`Injecting DOM Parser (Tokens, Geometry, A11y)...`);
  const captureData = await page.evaluate(() => {
    let counter = 1;
    const elements = document.querySelectorAll(
      "h1, h2, h3, h4, p, img, a, div, section, article, nav, header, footer, button",
    );
    const nodeMap: any[] = [];

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      // Ignore invisible elements or script/style blobs
      if (
        (rect.width === 0 && rect.height === 0) ||
        el.tagName === "SCRIPT" ||
        el.tagName === "STYLE" ||
        el.tagName === "SVG"
      ) {
        return;
      }

      el.setAttribute("data-awa-id", counter.toString());

      // Extract bounding box and semantic accessibility
      const computed = window.getComputedStyle(el);
      const parentRect = el.parentElement ? el.parentElement.getBoundingClientRect() : { width: window.innerWidth };
      
      nodeMap.push({
        id: counter,
        tag: el.tagName,
        geometry: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          parentWidth: parentRect.width,
        },
        style: {
          backgroundColor: computed.backgroundColor,
          marginTop: parseInt(computed.marginTop) || 0,
        },
        a11y: {
          role: el.getAttribute("role") || null,
          alt: el.getAttribute("alt") || null,
          ariaLabel: el.getAttribute("aria-label") || null,
        },
      });

      counter++;
    });

    // Capture Deep W3C Design Tokens from Stylesheets
    const designTokens: Record<string, any> = { color: {}, fontFamily: {} };

    // Fallback: Body Computed Styles
    const bodyComputed = window.getComputedStyle(document.body);
    designTokens.color.primary = { $value: bodyComputed.color, $type: "color" };
    designTokens.color.background = {
      $value: bodyComputed.backgroundColor,
      $type: "color",
    };

    // Deep token extraction
    for (let i = 0; i < document.styleSheets.length; i++) {
      try {
        const sheet = document.styleSheets[i];
        // Cross-origin CSS will securely throw an error if accessed
        if (!sheet.cssRules) continue;

        for (let j = 0; j < sheet.cssRules.length; j++) {
          const rule = sheet.cssRules[j] as CSSStyleRule;
          if (rule.style) {
            for (let k = 0; k < rule.style.length; k++) {
              const propName = rule.style[k];
              if (propName.startsWith("--")) {
                const val = rule.style.getPropertyValue(propName).trim();

                // Naive DTCG type grouping
                let type = "color";
                let group = "color";
                if (propName.includes("font") || propName.includes("text")) {
                  type = "fontFamily";
                  group = "fontFamily";
                }

                const cleanName = propName.replace("--", "");
                designTokens[group][cleanName] = { $value: val, $type: type };
              }
            }
          }
        }
      } catch (e) {
        // Ignore cross-origin stylesheet CORS exemptions
      }
    }

    // Capture SEO Metadata
    const seo = {
      title: document.title || null,
      description:
        document
          .querySelector('meta[name="description"]')
          ?.getAttribute("content") || null,
      ogImage:
        document
          .querySelector('meta[property="og:image"]')
          ?.getAttribute("content") || null,
    };

    return { tokens: designTokens, nodeMap, seo };
  });

  console.log(`Capturing Serialized DOM Snapshot...`);
  const html = await page.content();

  // URL formatter to flat filename format
  const cleanUrl =
    url.replace(/https?:\/\//, "").replace(/[\/\\]/g, "_") || "index";

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, `${cleanUrl}_dom.html`),
    html,
    "utf-8",
  );
  await fs.writeFile(
    path.join(outputDir, `${cleanUrl}_tokens.json`),
    JSON.stringify(captureData.tokens, null, 2),
    "utf-8",
  );
  await fs.writeFile(
    path.join(outputDir, `${cleanUrl}_geometry.json`),
    JSON.stringify(captureData.nodeMap, null, 2),
    "utf-8",
  );
  await fs.writeFile(
    path.join(outputDir, `${cleanUrl}_seo.json`),
    JSON.stringify(captureData.seo, null, 2),
    "utf-8",
  );

  await browser.close();
  return {
    html,
    tokens: captureData.tokens,
    nodeMap: captureData.nodeMap,
    seo: captureData.seo,
  };
}
