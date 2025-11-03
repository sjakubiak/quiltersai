import { openai, GPT_MODEL } from "../lib/openai-client";
import type { PromptInterpretResponse } from "@shared/schema";

const SYSTEM_PROMPT = `You are an expert quilt design consultant. Your job is to interpret natural language descriptions of quilts and convert them into structured specifications.

Analyze the user's prompt and extract:
1. Size (width, height in inches, category: baby/throw/twin/full/queen/king)
2. Style tags (modern, traditional, boho, minimalist, etc.)
3. Color palette (hex codes or color names)
4. Budget in USD (if mentioned)
5. Shape constraints (allowed shapes, shapes to avoid)
6. Skill level (beginner, intermediate, advanced)
7. Piecing method (machine, hand)
8. Sashing preference (true/false)
9. Border width in inches
10. Binding preference (bias vs straight)
11. Prewash preference

Interpret vague descriptions intelligently:
- "twin quilt" → 60×80 inches
- "teal and charcoal" → extract hex codes or use common approximations
- "no triangles" → add HST, flying geese to avoid list
- "budget friendly" → assume lower yardage, simpler patterns
- "intermediate" skill → suitable for confident beginners with some experience

Return ONLY a valid JSON object matching this structure:
{
  "spec": {
    "size": {
      "width_in": number,
      "height_in": number,
      "category": string
    },
    "style_tags": string[],
    "palette": string[],
    "budget_usd": number | undefined,
    "constraints": {
      "shapes": string[] | undefined,
      "avoid": string[] | undefined
    },
    "skill_level": string,
    "piecing": string,
    "sashing": boolean,
    "border": number,
    "binding_bias": boolean,
    "prewash": boolean
  }
}`;

export async function interpretPrompt(prompt: string): Promise<PromptInterpretResponse> {
  try {
    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 8192,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const parsed = JSON.parse(content) as PromptInterpretResponse;
    return parsed;
  } catch (error) {
    console.error("Error interpreting prompt:", error);
    
    // Fallback to reasonable defaults
    return {
      spec: {
        size: {
          width_in: 60,
          height_in: 80,
          category: "twin",
        },
        style_tags: ["modern"],
        palette: ["#008B8B", "#2F4F4F", "#FFFFFF"], // teal, charcoal, white
        budget_usd: 120,
        constraints: {
          shapes: ["rectangles", "squares"],
          avoid: [],
        },
        skill_level: "intermediate",
        piecing: "machine",
        sashing: false,
        border: 0,
        binding_bias: false,
        prewash: true,
      },
    };
  }
}
