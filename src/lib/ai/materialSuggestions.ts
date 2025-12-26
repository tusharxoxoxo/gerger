/**
 * AI-powered material suggestions and priority recommendations
 * 
 * This service provides intelligent suggestions for:
 * 1. Material names based on user input (autocomplete)
 * 2. Priority recommendations based on context
 * 
 * For production, replace mock implementations with actual AI API calls
 * (OpenAI, Anthropic, etc.)
 */

// Common construction materials for autocomplete suggestions
const COMMON_MATERIALS = [
  "Cement",
  "Concrete",
  "Steel Rebar",
  "Lumber",
  "Drywall",
  "Insulation",
  "Roofing Shingles",
  "Windows",
  "Doors",
  "Paint",
  "Tile",
  "Brick",
  "Sand",
  "Gravel",
  "Electrical Wire",
  "Plumbing Pipes",
  "HVAC Ducts",
  "Flooring",
  "Hardware",
  "Fasteners",
];

export interface MaterialSuggestion {
  name: string;
  confidence: number;
}

/**
 * Get material name suggestions based on user input
 * Uses fuzzy matching and can be enhanced with AI semantic search
 */
export async function getMaterialSuggestions(
  query: string,
  pastRequests?: string[]
): Promise<MaterialSuggestion[]> {
  if (!query || query.length < 2) {
    return [];
  }

  const queryLower = query.toLowerCase();
  
  // Combine common materials with past requests
  const allMaterials = [
    ...COMMON_MATERIALS,
    ...(pastRequests || []),
  ];

  // Simple fuzzy matching (can be replaced with AI semantic search)
  const suggestions = allMaterials
    .filter((material) => {
      const materialLower = material.toLowerCase();
      return (
        materialLower.includes(queryLower) ||
        queryLower.includes(materialLower) ||
        materialLower.startsWith(queryLower)
      );
    })
    .slice(0, 5)
    .map((material) => ({
      name: material,
      confidence: material.toLowerCase().startsWith(queryLower) ? 0.9 : 0.7,
    }));

  // If OpenAI API key is available, use it for better suggestions
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (openaiKey && query.length > 3) {
    try {
      const aiSuggestions = await getAIMaterialSuggestions(query, openaiKey);
      // Merge and deduplicate
      const merged = [...suggestions, ...aiSuggestions];
      const unique = merged.reduce((acc, curr) => {
        if (!acc.find((item) => item.name === curr.name)) {
          acc.push(curr);
        }
        return acc;
      }, [] as MaterialSuggestion[]);
      return unique.slice(0, 5);
    } catch (error) {
      console.warn("AI suggestions failed, using fallback:", error);
    }
  }

  return suggestions;
}

/**
 * Get AI-powered material suggestions using OpenAI
 */
async function getAIMaterialSuggestions(
  query: string,
  apiKey: string
): Promise<MaterialSuggestion[]> {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a construction material expert. Suggest 3-5 construction material names based on the user's input. Return only material names, one per line.",
          },
          {
            role: "user",
            content: `Suggest construction materials matching: ${query}`,
          },
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error("OpenAI API request failed");
    }

    const data = await response.json();
    const suggestions = data.choices[0]?.message?.content
      ?.split("\n")
      .filter((line: string) => line.trim().length > 0)
      .map((line: string) => ({
        name: line.trim().replace(/^[-*]\s*/, ""),
        confidence: 0.85,
      }))
      .slice(0, 5) || [];

    return suggestions;
  } catch (error) {
    console.error("OpenAI API error:", error);
    return [];
  }
}

export interface PrioritySuggestion {
  priority: "low" | "medium" | "high" | "urgent";
  reasoning: string;
  confidence: number;
}

/**
 * Suggest priority based on material context
 * Uses heuristics and can be enhanced with AI
 */
export async function suggestPriority(
  materialName: string,
  quantity: number,
  unit: string,
  projectId?: string
): Promise<PrioritySuggestion> {
  // Base heuristics
  let priority: "low" | "medium" | "high" | "urgent" = "medium";
  let reasoning = "Standard priority based on quantity and material type";
  let confidence = 0.6;

  // High quantity = higher priority
  if (quantity > 1000) {
    priority = "high";
    reasoning = "Large quantity indicates urgent need";
    confidence = 0.7;
  }

  // Critical materials = higher priority
  const criticalMaterials = ["cement", "concrete", "steel", "rebar", "electrical", "plumbing"];
  const isCritical = criticalMaterials.some((mat) =>
    materialName.toLowerCase().includes(mat)
  );
  if (isCritical) {
    priority = priority === "high" ? "urgent" : "high";
    reasoning = "Critical construction material";
    confidence = 0.8;
  }

  // Small quantities = lower priority
  if (quantity < 10 && unit !== "pieces") {
    priority = "low";
    reasoning = "Small quantity, less urgent";
    confidence = 0.7;
  }

  // If OpenAI API key is available, use it for better recommendations
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const aiSuggestion = await getAIPrioritySuggestion(
        materialName,
        quantity,
        unit,
        apiKey
      );
      if (aiSuggestion) {
        return aiSuggestion;
      }
    } catch (error) {
      console.warn("AI priority suggestion failed, using heuristics:", error);
    }
  }

  return { priority, reasoning, confidence };
}

/**
 * Get AI-powered priority suggestion using OpenAI
 */
async function getAIPrioritySuggestion(
  materialName: string,
  quantity: number,
  unit: string,
  apiKey: string
): Promise<PrioritySuggestion | null> {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a construction project manager. Analyze material requests and suggest priority (low, medium, high, urgent). Respond in JSON format: {\"priority\": \"medium\", \"reasoning\": \"explanation\", \"confidence\": 0.8}",
          },
          {
            role: "user",
            content: `Material: ${materialName}, Quantity: ${quantity} ${unit}. Suggest priority.`,
          },
        ],
        max_tokens: 150,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      throw new Error("OpenAI API request failed");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return {
        priority: parsed.priority || "medium",
        reasoning: parsed.reasoning || "AI-suggested priority",
        confidence: parsed.confidence || 0.8,
      };
    }
  } catch (error) {
    console.error("OpenAI API error:", error);
  }

  return null;
}

