export interface SlideContent {
  slideNumber: number
  title: string
  content: string[]
  imageQuery?: string
}

export interface GeneratedContent {
  slides: SlideContent[]
}

/**
 * Generate presentation content using OpenRouter's Gemini 2.0 Flash
 */
export async function generateContentWithAI(prompt: string, slideCount?: number): Promise<GeneratedContent> {
  const apiKey = process.env.OPENROUTER_API_KEY?.replace(/\s/g, "")

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured. Please add it to your environment variables.")
  }

  // Validate API key format (should start with sk-or-)
  if (!apiKey.startsWith("sk-or-")) {
    console.error("[v0] Invalid API key format. Expected sk-or-... but got:", apiKey.substring(0, 10) + "...")
    throw new Error("Invalid OpenRouter API key format. Key should start with 'sk-or-'")
  }

  console.log("[v0] Using OpenRouter API key:", apiKey.substring(0, 12) + "..." + apiKey.substring(apiKey.length - 4))

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    "X-Title": "AI PPT Generator",
  }

  const slideCountText = slideCount ? `exactly ${slideCount} slides` : "5-7 slides"

  const userPrompt = `Create a professional presentation about: ${prompt}

Generate ${slideCountText} with:
- Compelling, action-oriented titles that grab attention (max 8 words)
- 5-7 detailed bullet points per slide with clear value propositions
- Each bullet point should be 15-25 words with specific, actionable information
- Include statistics, percentages, or numbers where relevant
- Professional tone with engaging language
- Logical flow from introduction to conclusion
- For imageQuery: use SHORT keywords (max 30 chars) like "business meeting" or "technology"

Include these slide types:
1. Title slide with overview
2. Problem/Challenge slide
3. Solution/Approach slides (2-3)
4. Benefits/Results slide
5. Conclusion/Call-to-action slide

Make it visually appealing and impactful. Return as JSON only.`

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001",
      messages: [
        {
          role: "system",
          content: `You are an expert presentation designer and content strategist. Create compelling, professional presentation content that:

1. Uses powerful, action-oriented titles (max 8 words) that capture attention
2. Creates 5-7 detailed bullet points per slide, each 15-25 words with specific information
3. Includes numbers, statistics, percentages where relevant (e.g., "Increase productivity by 40%")
4. Maintains a professional yet engaging tone throughout
5. Structures content logically with smooth transitions between slides
6. Uses active voice, strong verbs, and specific examples
7. Each bullet point should be a complete thought with actionable insight

IMPORTANT: Return ONLY valid JSON (no markdown, no code blocks, no trailing commas) with this exact structure:
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "Short Powerful Title",
      "content": ["Detailed bullet point 1 with specific information and value", "Detailed bullet point 2", "More points..."],
      "imageQuery": "two word keyword"
    }
  ]
}

For imageQuery, use VERY SHORT simple keywords (max 25 characters) like "teamwork" or "technology" or "charts" - just 1-2 words.`,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.8, // Increased for more creative, engaging content
      max_tokens: 3000, // Increased for more detailed content
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error("[v0] OpenRouter API error:", response.status, error)
    
    if (response.status === 401) {
      throw new Error("OpenRouter API key is invalid or expired. Please check your OPENROUTER_API_KEY in environment variables.")
    }
    
    throw new Error(`OpenRouter API failed: ${response.status} - ${error}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content

  if (!content) {
    throw new Error("No content generated from AI")
  }

  // Parse the JSON response, handling potential markdown code blocks
  let jsonContent = content.trim()
  if (jsonContent.startsWith("```json")) {
    jsonContent = jsonContent.replace(/```json\n?/g, "").replace(/```\n?$/g, "")
  } else if (jsonContent.startsWith("```")) {
    jsonContent = jsonContent.replace(/```\n?/g, "")
  }

  try {
    const parsed = JSON.parse(jsonContent)
    console.log(`[v0] Successfully generated ${parsed.slides?.length || 0} slides`)
    return parsed
  } catch (error) {
    console.error("[v0] Failed to parse AI response:", jsonContent)
    throw new Error("Failed to parse AI-generated content")
  }
}
