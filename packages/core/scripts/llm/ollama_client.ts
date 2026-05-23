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
  const temperature = options.temperature ?? 0.2;

  const jsonSchema = zodToJsonSchema(schema);

  let attempt = 0;
  const maxAttempts = 3;
  let lastError: string | null = null;
  let promptSuffix = "";

  while (attempt < maxAttempts) {
    attempt++;
    const prompt = `You are a strict data classification assistant that deduces layout components.
Given the following raw snippet containing DOM tree nodes and IDs, your job is to discover the abstract UI component type.
Examples of types: "Hero", "Footer", "CardGrid", "Navigation", "Testimonial", "RichText", "FeatureList".
Do NOT reply with "N/A" unless it is completely empty. Guess the best fit based on tags and visual structure.
Return exactly the 'nodeId' string (e.g., "123") matching the id of the element that maps to each field.

CRITICAL RULES:
1. Your response MUST be ONLY valid JSON mapping exactly to the schema.
2. The values in the "mappings" object MUST be ONLY numeric digits, comma separated (e.g., "123, 124"). Do NOT embed text or repeat words like 'content_content_content' or 'thought' or 'feature_item'. NEVER output anything other than numeric IDs and commas in the values.
3. NEVER output arrays with more than 10 items.
4. If there are lists or repeating items, group them conceptually and limit to 5 items max. Do not get caught in an infinite loop.
${promptSuffix}

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
          repeat_penalty: 1.5,
          num_predict: 512, // Reduced to prevent infinite loops
        },
      }),
      signal: AbortSignal.timeout(120000), // Reduced down to 2 mins for classification
    });

    if (!response.ok) {
      throw new Error(
        `Ollama API Error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    try {
      const parsedPayload = JSON.parse(data.response);
      
      // Clean up hallucinated string repetition (e.g. "123_content_content")
      if (parsedPayload.mappings) {
        for (const key of Object.keys(parsedPayload.mappings)) {
          if (typeof parsedPayload.mappings[key] === "string") {
             // Only keep digits and commas
             parsedPayload.mappings[key] = parsedPayload.mappings[key].replace(/[^\d,]/g, '').trim();
             // Remove trailing or leading commas
             parsedPayload.mappings[key] = parsedPayload.mappings[key].replace(/^,+|,+$/g, '');
          }
        }
      }

      return schema.parse(parsedPayload);
    } catch (error: any) {
      console.log(`[JSON Guard] Attempt ${attempt} failed: ${error.message}.`);
      lastError = error.message;
      promptSuffix = `\n\nWARNING: Your last attempt failed with error: "${error.message}". You MUST provide perfectly valid JSON. Rule Reminder: "mappings" values MUST BE ONLY numeric IDs (e.g., "123", "45, 46"). No text repetition!`;

      if (attempt === maxAttempts) {
        if (error instanceof SyntaxError) {
          throw new Error(`Failed to parse LLM JSON response after ${maxAttempts} attempts. Last output: ${data.response}`);
        }
        throw new Error(`Classification failed after ${maxAttempts} attempts: ${error.message}`);
      }
    }
  }

  throw new Error("classifyChunk exhausted max attempts without returning");
}

export async function generateCode(
  prompt: string,
  options: OllamaOptions = {},
): Promise<{ component: string; story?: string }> {
  // Use gemma4:e4b which we know is locally installed instead of our hallucinated model
  const model = options.model || "gemma4:e4b"; 
  const endpoint = options.endpoint || "http://localhost:11434/api/generate";
  const temperature = options.temperature ?? 0.1;

  let attempt = 0;
  const maxAttempts = 2; // Retry loop

  while(attempt < maxAttempts) {
    attempt++;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt,
          stream: true, // We must use STREAMING. Node's Undici has a hard 5-minute undici.headersTimeout, forcing stream prevents failure.
          options: {
            temperature,
          },
        }),
        signal: AbortSignal.timeout(600000), // Absolute max time 10m
      });

      if (!response.ok) {
        throw new Error(
          `Ollama API Error: ${response.status} ${response.statusText}`,
        );
      }

      // Stream parsing loop
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body to read");

      const decoder = new TextDecoder();
      let fullResponse = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.trim() !== '');
        
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.response) {
              fullResponse += parsed.response;
            }
          } catch(e) {
            // Ignore partial JSON lines
          }
        }
      }

      // Extract code from markdown tags
      const codeStr = fullResponse;
      const blocks: string[] = [];
      const regex = /```(?:tsx|jsx|ts|js)?\n([\s\S]*?)```/g;
      let match;
      while ((match = regex.exec(codeStr)) !== null) {
        if (match[1]) {
          blocks.push(match[1].trim());
        }
      }

      if (blocks.length === 0) {
        return { component: codeStr.trim() }; // fallback
      }

      return {
        component: blocks[0],
        story: blocks.length > 1 ? blocks[1] : undefined,
      };

    } catch (error: any) {
      console.log(`[Hydrator Guard] Attempt ${attempt} failed: ${error.message}`);
      if(attempt === maxAttempts) {
        throw error;
      }
    }
  }
  throw new Error("unreachable");
}
