import { NextRequest, NextResponse } from "next/server"
import { generateContentWithAI } from "@/lib/ai-content-generator"

interface GenerateSectionRequest {
  pageNumber: number
  sectionType: string
  prompt: string
  context?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateSectionRequest = await request.json()

    console.log(
      "[v0] Generating section for page",
      body.pageNumber,
      "Type:",
      body.sectionType
    )

    const enhancedPrompt = `Generate ${body.sectionType} content for a document. ${body.context ? `Context: ${body.context}` : ""} User request: ${body.prompt}`

    const response = await generateContentWithAI(enhancedPrompt)

    if (!response.slides || response.slides.length === 0) {
      throw new Error("No content generated")
    }

    const generatedContent = response.slides[0].content.join("\n")

    return NextResponse.json({
      success: true,
      content: generatedContent,
      sectionId: `section-${body.pageNumber}-${Date.now()}`,
    })
  } catch (error) {
    console.error("[v0] Error generating section:", error)
    return NextResponse.json(
      {
        error: "Failed to generate section",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
