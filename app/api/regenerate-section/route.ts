import { NextRequest, NextResponse } from "next/server"
import { generateContentWithAI } from "@/lib/ai-content-generator"

export async function POST(request: NextRequest) {
  try {
    const { sectionType, currentContent, regenerationPrompt, pageContext } = await request.json()

    console.log("[v0] Regenerating section:", sectionType)

    // Build context-aware prompt
    const enhancedPrompt = `
      Section Type: ${sectionType}
      Current Content: ${currentContent}
      
      User Request: ${regenerationPrompt}
      ${pageContext ? `Page Context: ${pageContext}` : ""}
      
      Please regenerate the content based on the user's request, keeping the same section type format.
      Make the content more engaging, detailed, and valuable.
    `

    // Generate new content
    const response = await generateContentWithAI(enhancedPrompt)

    if (!response.slides || response.slides.length === 0) {
      throw new Error("No content generated")
    }

    const regeneratedContent = response.slides[0].content.join("\n")

    return NextResponse.json({
      success: true,
      content: regeneratedContent,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Error regenerating section:", error)
    return NextResponse.json(
      {
        error: "Failed to regenerate section",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
