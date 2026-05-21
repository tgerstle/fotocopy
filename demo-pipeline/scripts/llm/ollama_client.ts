import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export interface OllamaOptions {
  model?: string;
  endpoint?: string;
  temperature?: number;
}

export async function classifyChunk<T>(
  chunkHtml: string,
  schema: z.ZodSchema<T>,
  options: OllamaOptions = {},
): Promise<T> {
  const model = options.model || "gemma4:e4b";
  const endpoint = options.endpoint || "http://localhost:11434/api/generate";
  const temperature = options.temperature ?? 0.1;

  // 1. Convert Zod schema to JSON schema for Ollama's structured output format
  const jsonSchema = zodToJsonSchema(schema);

  // 2. Construct Prompt ensuring it requests the ID pointer pattern & Discovery pattern
  const prompt = `You are a strict data classification assistant that deduces layout components.
Given the following raw snippet containing DOM tree nodes and IDs, your job is to discover the abstract UI component type.
Examples of types: "Hero", "Footer", "CardGrid", "Navigation", "Testimonial", "RichText".
Do NOT reply with "N/A" unless it is completely empty. Guess the best fit based on tags and visual structure.
Return exactly the 'nodeId' string (e.g., "123") matching the id of the element that maps to each field.
Your response MUST be ONLY valid JSON mapping exactly to the schema.

Example Output:
{
  "inferredBlockType": "Hero",
  "mappings": {
    "title": "12",
    "description": "13",
    "cta_button": "14",
    "background_image": "15",
    "avatar": "16"
  }
}
Note: If you see IMG tags, SVG tags, or blocks that suggest media assets, be sure to map them (e.g. "image": "ID", "icon": "ID").

DOM Nodes:
${chunkHtml}
`;

  // 3. Construct REST API Call
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      format: jsonSchema,
      stream: false,
      options: {
        temperature,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Ollama API Error: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();

  // 4. Parse & Validate
  try {
    const parsedPayload = JSON.parse(data.response);
    // Explicitly parse through Zod to guarantee strict compliance before returning
    return schema.parse(parsedPayload);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse LLM JSON response: ${data.response}`);
    }
    throw error;
  }
}

export async function generateCode(
  prompt: string,
  options: OllamaOptions = {}
): Promise<string> {
  const model = options.model || "gemma4:e4b";
  const endpoint = options.endpoint || "http://localhost:11434/api/generate";
  const temperature = options.temperature ?? 0.1;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Extract just the code from markdown tags if present
  let codeStr = data.response;
  if (codeStr.includes('```')) {
    const match = codeStr.match(/```(?:tsx|jsx|ts|js)?\n([\s\S]*?)```/);
    if (match && match[1]) {
      codeStr = match[1];
    }
  }
  
  return codeStr.trim();
}
