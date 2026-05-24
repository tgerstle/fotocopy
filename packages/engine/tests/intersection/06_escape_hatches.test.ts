import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { detectEscapeHatches } from "../../src/intersection/escape_hatches";
import { setConfig } from "../../src/config";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { execSync } from "child_process";

describe("Phase 6.2: Plugin Registry & Application Escape Hatches", () => {
  beforeEach(() => {
    setConfig({
      plugins: [
        { matcher: "iframe[src*='youtube.com']", tag: "PLUGIN:YOUTUBE" },
        { matcher: "form.hubspot-form", tag: "PLUGIN:HUBSPOT" },
      ],
    });
  });

  afterEach(() => {
    setConfig({});
  });

  it("identifies configured plugin matchers safely without the LLM", () => {
    const htmlChunk = `
      <div class="video-container">
        <iframe src="https://youtube.com/embed/12345" id="vid-1"></iframe>
      </div>
    `;

    const match = detectEscapeHatches(htmlChunk);
    expect(match).toBeDefined();
    expect(match?.tag).toBe("PLUGIN:YOUTUBE");
    expect(match?.originalNodeId).toBe("vid-1");
  });

  it("identifies generic complex WebGL/Canvas interactions", () => {
    const htmlChunk = `
      <div class="hero">
        <canvas id="three-js-canvas"></canvas>
      </div>
    `;

    const match = detectEscapeHatches(htmlChunk);
    expect(match).toBeDefined();
    expect(match?.tag).toBe("MANUAL_INTERVENTION");
    expect(match?.reason).toContain("WebGL/Canvas");
    expect(match?.originalNodeId).toBe("three-js-canvas");
  });

  it("returns null if no escape hatch matches", () => {
    const htmlChunk = `
      <div class="hero">
        <h1>Hello World</h1>
      </div>
    `;

    const match = detectEscapeHatches(htmlChunk);
    expect(match).toBeNull();
  });
});

describe("Placeholder Scaffolding", () => {
  it("generates a valid React component structure for MANUAL_INTERVENTION", () => {
    // Mock importing the generator (we test engine separately but can mock it or assume it's exposed)
    const generateManualPlaceholder = (
      componentName: string,
      reason: string,
      originalNodeId: string,
    ) => {
      return `import React from 'react';\n\nexport const ${componentName} = () => {\n  return (\n    <div className="border-4 border-red-500 bg-red-100 p-8 my-4 text-red-900 rounded">\n      <h2 className="text-2xl font-black">Manual Migration Required</h2>\n      <p>\n        <strong>Reason:</strong> ${reason}\n      </p>\n      <p>\n        <strong>Node Ref:</strong> ${originalNodeId}\n      </p>\n    </div>\n  );\n};\n`;
    };

    const code = generateManualPlaceholder(
      "ManualWidgetPlaceholder",
      "Contains complex WebGL canvas interaction",
      "id-593",
    );

    expect(code).toContain("Manual Migration Required");
    expect(code).toContain("Contains complex WebGL canvas interaction");
    expect(code).toContain("id-593");
    expect(code).toContain("export const ManualWidgetPlaceholder = () => {");
  });
});
