# Future Evaluation: "Golden Examples" (Few-Shot Anchoring)

## Overview
This concept is designated for future evaluation and should be tested **only after** observing the impact of the multi-pass optimizations and token enhancements defined in `p6_05_llm_scaffolding_optimization.md`.

Providing the LLM with a flawless, manual "Golden Component" template in its system prompt acts as a few-shot anchor. It forces the LLM to mimic preferred import ordering, prop destructuring patterns, and Shadcn usage without needing exhaustive instructional paragraphs.

## Key Topics for Future Discussion & Experimentation

### 1. The "Content Bleed" Risk (Hallucination)
Small LLMs (like Llama 3 8B or Gemma) struggle to separate the *structure* of a few-shot example from its *content*. 
*   **The Risk:** If we provide a `UserTestimonial` as the Golden Example, the LLM may hallucinate variables like `authorName` or `rating` into a new `PricingTable` component simply because it saw them in the prompt.
*   **The Mitigation Hypothesis:** We need to test if the template must be highly abstract (e.g., `<GenericWidget title={props.heading}>`) to prevent domain bias, or if strong negative prompting ("DO NOT COPY THESE PROPS") is sufficient.

### 2. Universal vs. Contextual Injection
*   **Universal:** Do we use one single, perfect boilerplate component injected into every single generation string? This keeps the architecture simple but may lack specificity.
*   **Contextual (Dynamic Retrieval):** Should we write 3-4 different golden examples (e.g., one specifically for CSS Grids, one for Forms/Inputs, one for Data Display)? Before generating a component, the pipeline would classify the *type* of component needed and dynamically slot in the most relevant golden template. This yields higher quality but adds classification overhead.

### 3. Token Cost & Constraints
*   **The Constraint:** A full, well-commented "Golden Component" might add 200–400 tokens to the System Prompt.
*   **The Trade-off:** Since we are strictly optimizing to stay within the `num_predict` local processing limits, we must evaluate if the added 400 context tokens provides enough deterministic quality to justify the slower generation speed and reduced output window.
