import { describe, it, expect } from "vitest";
import { extractCodeBlocks } from "../../scripts/scaffolding/llm_parser";

describe("Stage 6: LLM Output Code Parsing Validations", () => {
  it("extracts component and story blocks out of conversational LLM markdown", () => {
    // 1. Mock Input (Chaotic LLM Output)
    const rawLlmMarkdown = `
Sure, I can build that React Hero block for you! Here is the component:

\`\`\`tsx
export const Hero = () => {
  return <div>Hero Component</div>;
}
\`\`\`

And here is the Storybook file for testing it:

\`\`\`tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Hero } from './Hero';

const meta = {
  title: 'Blocks/Hero',
  component: Hero,
} satisfies Meta<typeof Hero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { title: "Hello World" }
};
\`\`\`

Good luck with your Fotocopy migration!
`;

    // 2. Action
    const result = extractCodeBlocks(rawLlmMarkdown);

    // 3. Mock Output Assertions
    expect(result.componentCode).toBe(
      "export const Hero = () => {\n  return <div>Hero Component</div>;\n}",
    );
    expect(result.storyCode).toContain(
      "import type { Meta, StoryObj } from '@storybook/react';",
    );
    expect(result.storyCode).toContain('args: { title: "Hello World" }');
  });

  it("handles when only a component code block is provided", () => {
    const rawLlmMarkdown = `
\`\`\`tsx
export const Footer = () => <footer />;
\`\`\`
`;
    // Action
    const result = extractCodeBlocks(rawLlmMarkdown);

    // Assert
    expect(result.componentCode).toBe(
      "export const Footer = () => <footer />;",
    );
    expect(result.storyCode).toBeUndefined(); // Should gracefully skip
  });
});
