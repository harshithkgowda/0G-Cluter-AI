import { NextRequest, NextResponse } from "next/server"
import { generateContentWithAI } from "@/lib/ai-content-generator"
import { DocumentPage, DocumentSection } from "@/types/document"

interface ProcessDocumentRequest {
  fileName: string
  fileSize: number
  pageCount: number
  prompt: string
  slides: Array<{
    pageNumber: number
    title: string
    content: string[]
  }>
}

export async function POST(request: NextRequest) {
  try {
    const body: ProcessDocumentRequest = await request.json()

    console.log("[v0] Processing document:", body.fileName, "Pages:", body.pageCount)

    const pages: DocumentPage[] = []

    // Process each page
    for (const slide of body.slides) {
      const sections: DocumentSection[] = []

      // Add title
      sections.push({
        id: `section-${slide.pageNumber}-title`,
        type: "title",
        content: slide.title,
      })

      // Add content sections
      for (const content of slide.content) {
        const sectionId = `section-${slide.pageNumber}-${sections.length}`

        // Mark as generating
        const section: DocumentSection = {
          id: sectionId,
          type: "paragraph",
          content: "",
          isGenerating: true,
        }

        sections.push(section)
      }

      const page: DocumentPage = {
        id: `page-${slide.pageNumber}`,
        pageNumber: slide.pageNumber,
        title: slide.title,
        sections,
        generatedAt: new Date(),
      }

      pages.push(page)
    }

    return NextResponse.json({
      success: true,
      pages,
      totalPages: pages.length,
    })
  } catch (error) {
    console.error("[v0] Error processing document:", error)
    return NextResponse.json(
      {
        error: "Failed to process document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
