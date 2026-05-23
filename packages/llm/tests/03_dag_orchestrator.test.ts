import { describe, it, expect, vi } from "vitest";
import { generateMapReduceStrategy } from "../src/scaffolding/prompt_generator";

describe("Stage 3: DAG Orchestrator Validator", () => {
  it("breaks down a complex component into micro-primitive Map statements", async () => {
    // 1. Mock Input (A unified JSON semantic blueprint defining a <Footer>)
    const mockComponentBlueprint = {
      name: "Footer",
      schema: {
        newsletterText: "string",
        newsletterSubmitLabel: "string",
        socialLinks: "Array<{ icon: string, url: string }>",
        copyright: "string",
      },
    };

    // 2. Mock Token Dictionary (to ensure it gets injected)
    const mockTokens = {
      cssVariables: {
        "--primary": "255 0 0",
        "--background": "20 20 20",
      },
    };

    // We can inject a mocked LLM function that fakes resolving the strategy
    const mockLlmAnalyzer = vi.fn().mockResolvedValue({
      primitives: ["SocialLink", "NewsletterForm"],
      orchestrator: "FooterLayout",
    });

    // 3. Action
    const result = await generateMapReduceStrategy(
      mockComponentBlueprint,
      mockTokens,
      mockLlmAnalyzer,
    );

    // 4. Mock Output Assertion
    // Expect 3 separate logical blocks to be returned for later generation
    expect(result.tasks.length).toBe(3);

    // Assert Primitives come first
    expect(result.tasks[0].type).toBe("primitive");
    expect(result.tasks[0].name).toBe("SocialLink");

    expect(result.tasks[1].type).toBe("primitive");
    expect(result.tasks[1].name).toBe("NewsletterForm");

    // Assert Orchestrator comes last
    expect(result.tasks[2].type).toBe("orchestrator");
    expect(result.tasks[2].name).toBe("FooterLayout");

    // Ensure the system prompt dynamically included the tokens
    expect(result.systemPrompt).toContain("--primary: 255 0 0");
  });
});
