import { NextRequest, NextResponse } from "next/server"
import { DocumentPage, DocumentSection } from "@/types/document"

// Simple PPTX parser - extract text and basic structure
async function parsePPTX(buffer: Buffer): Promise<DocumentPage[]> {
  try {
    const JSZip = require("jszip")
    const zip = new JSZip()
    await zip.loadAsync(buffer)

    // Extract presentation XML
    const slides: DocumentPage[] = []
    let slideCount = 0

    // Get all slide files
    const slideFiles = Object.keys(zip.files)
      .filter(name => name.includes("ppt/slides/slide") && name.endsWith(".xml"))
      .sort()

    for (const slideFile of slideFiles) {
      slideCount++
      const slideXml = await zip.file(slideFile).async("string")

      // Extract text content from slide
      const textMatches = slideXml.match(/<a:t>([^<]*)<\/a:t>/g) || []
      const texts = textMatches.map(m => m.replace(/<[^>]*>/g, "")).filter(t => t.trim())

      const sections: DocumentSection[] = []

      if (texts.length > 0) {
        // First text is usually title
        sections.push({
          id: `section-${slideCount}-title`,
          type: "title",
          content: texts[0] || `Slide ${slideCount}`,
        })

        // Rest are content
        for (let i = 1; i < texts.length; i++) {
          if (texts[i].trim()) {
            sections.push({
              id: `section-${slideCount}-${i}`,
              type: "paragraph",
              content: texts[i],
            })
          }
        }
      } else {
        sections.push({
          id: `section-${slideCount}-title`,
          type: "title",
          content: `Slide ${slideCount}`,
        })
      }

      slides.push({
        id: `page-${slideCount}`,
        pageNumber: slideCount,
        title: texts[0] || `Slide ${slideCount}`,
        sections,
        generatedAt: new Date(),
      })
    }

    return slides.length > 0 ? slides : createMockPages()
  } catch (error) {
    console.error("[v0] Error parsing PPTX:", error)
    return createMockPages()
  }
}

function createMockPages(): DocumentPage[] {
  const pages: DocumentPage[] = []
  for (let i = 1; i <= 3; i++) {
    const sections: DocumentSection[] = []
    sections.push({
      id: `section-${i}-title`,
      type: "title",
      content: `Slide ${i}`,
    })
    sections.push({
      id: `section-${i}-content`,
      type: "paragraph",
      content: `This is content on slide ${i}. Click to edit.`,
    })
    pages.push({
      id: `page-${i}`,
      pageNumber: i,
      title: `Slide ${i}`,
      sections,
      generatedAt: new Date(),
    })
  }
  return pages
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const fileName = file.name
    const fileType = fileName.split(".").pop()?.toLowerCase()

    console.log("[v0] Processing document:", fileName, "Type:", fileType, "Size:", file.size)

    let pages: DocumentPage[] = []

    // Handle different file types
    if (fileType === "pptx") {
      const buffer = await file.arrayBuffer()
      pages = await parsePPTX(Buffer.from(buffer))
    } else if (fileType === "pdf" || fileType === "docx") {
      // For PDF and DOCX, create mock pages for now
      pages = createMockPages()
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PPTX, PDF, or DOCX" },
        { status: 400 }
      )
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
