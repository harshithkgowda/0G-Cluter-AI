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

Generate ${slideCountText} with these STRICT requirements:
- TITLES: Maximum 6-8 words, action-oriented and compelling
- BULLET POINTS: Exactly 4-6 bullets per slide (not more!)
- BULLET LENGTH: Each bullet must be 10-18 words maximum (short and impactful)
- Use statistics, percentages, or numbers where relevant
- Professional, concise language
- Logical flow from introduction to conclusion
- imageQuery: 1-2 simple words only (e.g., "teamwork", "innovation", "charts")

Include these slide types:
1. Title slide - compelling hook and overview
2. Problem/Challenge - what issue are we solving?
3. Solution slides (2-3) - how do we solve it?
4. Benefits/Results - what outcomes can be expected?
5. Conclusion - key takeaways and call-to-action

CRITICAL: Keep content concise to fit on slides. Long bullets will be truncated.
Return as valid JSON only.`

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are an expert presentation designer. Create CONCISE, professional presentation content optimized for visual slides.

STRICT FORMATTING RULES:
1. TITLES: Maximum 6-8 words, action-oriented (e.g., "Transform Your Business Today")
2. BULLETS: Exactly 4-6 bullet points per slide - NO MORE
3. BULLET LENGTH: Each bullet MUST be 10-18 words maximum - keep them punchy and scannable
4. Include numbers/statistics when relevant (e.g., "Boost efficiency by 35%")
5. Use active voice and strong verbs
6. imageQuery: Single word or two-word phrase only (e.g., "innovation", "data analytics")

SLIDE STRUCTURE:
- Slide 1: Title slide with main hook
- Slides 2-3: Problem/opportunity
- Slides 4-5: Solution/approach  
- Slide 6: Benefits/results
- Final slide: Key takeaways and call-to-action

IMPORTANT: Content MUST fit on slides. Bullets over 18 words will be truncated!

Return ONLY valid JSON (no markdown, no code blocks):
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "Short Title Here",
      "content": ["Short bullet 1", "Short bullet 2", "Short bullet 3", "Short bullet 4"],
      "imageQuery": "keyword"
    }
  ]
}`,
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
