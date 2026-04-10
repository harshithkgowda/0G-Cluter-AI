// AI Content Generator for Conference Papers using OpenRouter

interface GeneratedPaperContent {
  title: string
  abstract: string
  keywords: string[]
  sections: {
    heading: string
    content: string
  }[]
  references: string[]
}

export async function generatePaperContent(
  templateStructure: string,
  userPrompt: string,
  customTitle?: string,
  customAuthors?: string,
): Promise<GeneratedPaperContent> {
  const rawApiKey = process.env.OPENROUTER_API_KEY
  const apiKey = rawApiKey?.replace(/\s/g, "")

  console.log("[v0] Raw API key length:", rawApiKey?.length || 0)
  console.log("[v0] Cleaned API key length:", apiKey?.length || 0)
  console.log("[v0] API key prefix:", apiKey?.substring(0, 10) || "none")

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured. Please add it to your environment variables.")
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    "X-Title": "AI Conference Paper Generator",
  }

  console.log("[v0] Starting paper content generation...")
  console.log("[v0] Using model: google/gemini-2.0-flash-001")

  const systemPrompt = `You are an expert academic writer specializing in IEEE conference papers. Generate high-quality, professional academic content that matches the exact structure of the provided template.

IMPORTANT RULES:
1. Generate content that sounds natural and academic
2. Use proper academic language and terminology
3. Include specific technical details relevant to the topic
4. Each section should be substantial (200-400 words for main sections)
5. Generate realistic but fictional references in IEEE format
6. Keywords should be 4-6 relevant technical terms
7. The abstract should be 150-250 words summarizing the entire paper
8. Use proper paragraph structure with clear topic sentences
9. Include methodology details, results discussion, and future work implications
10. Make the content cohesive and well-connected between sections

ALWAYS respond with valid JSON only, no markdown code blocks.`

  const userMessage = `Based on this conference paper template structure:

${templateStructure}

Generate a complete conference paper about the following topic:

${userPrompt}

${customTitle ? `Use this title: ${customTitle}` : "Generate an appropriate academic title"}
${customAuthors ? `Authors: ${customAuthors}` : ""}

Respond with ONLY this JSON object (no markdown, no code blocks):
{
  "title": "Full academic title of the paper",
  "abstract": "Complete abstract (150-250 words)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "sections": [
    {
      "heading": "INTRODUCTION",
      "content": "Full introduction content with multiple paragraphs..."
    },
    {
      "heading": "RELATED WORKS",
      "content": "Literature review content..."
    },
    {
      "heading": "METHODOLOGY",
      "content": "Detailed methodology..."
    },
    {
      "heading": "RESULTS AND DISCUSSION",
      "content": "Results analysis..."
    },
    {
      "heading": "CONCLUSION",
      "content": "Conclusion and future work..."
    }
  ],
  "references": [
    "[1] Author Name, \\"Paper Title,\\" in Proceedings of Conference, Year, pp. xxx-xxx.",
    "[2] Author Name, \\"Another Paper,\\" Journal Name, vol. X, no. Y, pp. xxx-xxx, Year."
  ]
}

Generate substantial, detailed academic content for each section. Make it sound like a real conference paper.`

  try {
    console.log("[v0] Sending request to OpenRouter...")

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    })

    console.log("[v0] OpenRouter response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] OpenRouter API error:", errorText)
      throw new Error(`API request failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("[v0] OpenRouter response received")

    const content = data.choices?.[0]?.message?.content

    if (!content) {
      console.error("[v0] No content in response:", data)
      throw new Error("No content generated from AI")
    }

    console.log("[v0] Raw AI response length:", content.length)

    // Parse JSON from response - handle markdown code blocks
    let jsonContent = content

    // Remove markdown code blocks if present
    const jsonBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonBlockMatch) {
      jsonContent = jsonBlockMatch[1].trim()
    }

    // Try to find JSON object in the response
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error("[v0] Failed to find JSON in response:", content.substring(0, 500))
      throw new Error("Failed to parse generated content - no JSON found")
    }

    // Clean up common JSON issues from AI responses
    let cleanedJson = jsonMatch[0]
      // Remove trailing commas before } or ]
      .replace(/,(\s*[}\]])/g, '$1')
      // Fix unescaped newlines in strings
      .replace(/(?<!\\)\n(?=(?:[^"]*"[^"]*")*[^"]*"[^"]*$)/g, '\\n')
      // Remove any control characters
      .replace(/[\x00-\x1F\x7F]/g, (match) => {
        if (match === '\n' || match === '\r' || match === '\t') return match
        return ''
      })

    try {
      const parsed = JSON.parse(cleanedJson) as GeneratedPaperContent
      console.log("[v0] Successfully parsed paper content")
      console.log("[v0] Sections generated:", parsed.sections?.length || 0)
      return parsed
    } catch (parseError) {
      console.error("[v0] JSON parse error after cleanup:", parseError)
      
      // Try a more aggressive cleanup
      try {
        // Extract just the essential fields manually if JSON is truncated
        const titleMatch = cleanedJson.match(/"title"\s*:\s*"([^"]+)"/)
        const abstractMatch = cleanedJson.match(/"abstract"\s*:\s*"([\s\S]*?)"(?=\s*,\s*"keywords")/)
        const keywordsMatch = cleanedJson.match(/"keywords"\s*:\s*\[([\s\S]*?)\]/)
        
        if (titleMatch && abstractMatch) {
          console.log("[v0] Using fallback parsing for truncated response")
          
          // Parse sections array
          const sectionsMatch = cleanedJson.match(/"sections"\s*:\s*\[([\s\S]*?)\](?=\s*,\s*"references"|\s*\}$)/)
          const sections: { heading: string; content: string }[] = []
          
          if (sectionsMatch) {
            const sectionRegex = /\{\s*"heading"\s*:\s*"([^"]+)"\s*,\s*"content"\s*:\s*"([\s\S]*?)"\s*\}/g
            let match
            while ((match = sectionRegex.exec(sectionsMatch[1])) !== null) {
              sections.push({ heading: match[1], content: match[2].replace(/\\n/g, '\n').replace(/\\"/g, '"') })
            }
          }
          
          // Parse references
          const refsMatch = cleanedJson.match(/"references"\s*:\s*\[([\s\S]*?)\]/)
          const references: string[] = []
          if (refsMatch) {
            const refRegex = /"([^"]+)"/g
            let refMatch
            while ((refMatch = refRegex.exec(refsMatch[1])) !== null) {
              references.push(refMatch[1])
            }
          }
          
          // Parse keywords
          const keywords: string[] = []
          if (keywordsMatch) {
            const kwRegex = /"([^"]+)"/g
            let kwMatch
            while ((kwMatch = kwRegex.exec(keywordsMatch[1])) !== null) {
              keywords.push(kwMatch[1])
            }
          }
          
          return {
            title: titleMatch[1],
            abstract: abstractMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'),
            keywords: keywords.length > 0 ? keywords : ["AI", "Machine Learning", "Research"],
            sections: sections.length > 0 ? sections : [
              { heading: "INTRODUCTION", content: "Content generation was truncated. Please try again." }
            ],
            references: references.length > 0 ? references : [
              "[1] Reference data was truncated."
            ]
          }
        }
      } catch (fallbackError) {
        console.error("[v0] Fallback parsing also failed:", fallbackError)
      }
      
      console.error("[v0] Attempted to parse:", cleanedJson.substring(0, 500))
      throw new Error("Failed to parse AI response as JSON")
    }
  } catch (error) {
    console.error("[v0] Error generating paper content:", error)
    throw error
  }
}
