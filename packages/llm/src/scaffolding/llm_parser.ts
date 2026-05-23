export interface ParsedLlmCode {
  componentCode: string;
  storyCode?: string;
}

export function extractCodeBlocks(markdown: string): ParsedLlmCode {
  // Regex to match code blocks wrapped in ```tsx ... ``` or ```ts ... ``` or ```javascript ... ```
  // Because LLMs might use different languages or syntax, we capture loosely.
  const regex = /```[a-zA-Z]*\n([\s\S]*?)```/g;

  const matches: string[] = [];
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    if (match[1]) {
      matches.push(match[1].trim());
    }
  }

  // If there's primarily one block, assume it's the component.
  // If there are two blocks, assume the first is the component and the second is the story.
  return {
    componentCode: matches[0] || "",
    storyCode: matches[1] || undefined,
  };
}
