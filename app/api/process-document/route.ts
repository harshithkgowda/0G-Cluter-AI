import { NextRequest, NextResponse } from "next/server"
import { DocumentPage, DocumentSection } from "@/types/document"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    console.log("[v0] Processing document:", file.name, "Size:", file.size)

    // For now, create a mock document structure
    // In production, you would parse the file (PPTX, PDF, DOCX)
    const fileName = file.name
    const fileType = fileName.split(".").pop()?.toLowerCase()

    // Create mock pages based on file type
    const pages: DocumentPage[] = []

    // Create 3 sample pages for demonstration
    for (let i = 1; i <= 3; i++) {
      const sections: DocumentSection[] = []

      // Add title section
      sections.push({
        id: `section-${i}-title`,
        type: "title",
        content: `Page ${i} Title`,
      })

      // Add content sections
      for (let j = 1; j <= 2; j++) {
        sections.push({
          id: `section-${i}-${j}`,
          type: "paragraph",
          content: `This is content paragraph ${j} on page ${i}. Click to edit or use AI to regenerate.`,
        })
      }

      pages.push({
        id: `page-${i}`,
        pageNumber: i,
        title: `Page ${i}`,
        sections,
        generatedAt: new Date(),
      })
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
