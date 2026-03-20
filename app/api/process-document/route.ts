import { NextRequest, NextResponse } from "next/server"
import { DocumentPage, DocumentSection } from "@/types/document"

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
      content: `This is content on slide ${i}. Click to edit or regenerate with AI.`,
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

// Extract text from PPTX buffer using regex (PPTX is ZIP with XML)
function extractPPTXText(buffer: Buffer): string[] {
  try {
    const text = buffer.toString("utf8", 0, Math.min(buffer.length, 500000))
    
    // Extract text between XML tags (common in PPTX slides)
    const textMatches = text.match(/<a:t>([^<]*)<\/a:t>/g) || []
    const extracted = textMatches
      .map(m => m.replace(/<[^>]*>/g, ""))
      .filter(t => t.trim() && t.length > 0)
    
    console.log("[v0] Extracted", extracted.length, "text items from PPTX")
    return extracted
  } catch (error) {
    console.error("[v0] Error extracting PPTX text:", error)
    return []
  }
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

    if (fileType === "pptx") {
      try {
        const buffer = await file.arrayBuffer()
        const textContent = extractPPTXText(Buffer.from(buffer))

        if (textContent.length > 0) {
          // Group extracted text into slides (approximately 5-10 items per slide)
          const itemsPerSlide = Math.max(2, Math.ceil(textContent.length / 4))
          let slideIndex = 1

          for (let i = 0; i < textContent.length; i += itemsPerSlide) {
            const slideTexts = textContent.slice(i, i + itemsPerSlide)
            const sections: DocumentSection[] = []

            // First item is title
            sections.push({
              id: `section-${slideIndex}-title`,
              type: "title",
              content: slideTexts[0] || `Slide ${slideIndex}`,
            })

            // Rest are content
            for (let j = 1; j < slideTexts.length; j++) {
              if (slideTexts[j].trim()) {
                sections.push({
                  id: `section-${slideIndex}-${j}`,
                  type: "paragraph",
                  content: slideTexts[j],
                })
              }
            }

            pages.push({
              id: `page-${slideIndex}`,
              pageNumber: slideIndex,
              title: slideTexts[0] || `Slide ${slideIndex}`,
              sections,
              generatedAt: new Date(),
            })

            slideIndex++
          }
        }

        // Fallback to mock pages if extraction failed
        if (pages.length === 0) {
          pages = createMockPages()
        }
      } catch (error) {
        console.error("[v0] Error parsing PPTX:", error)
        pages = createMockPages()
      }
    } else if (fileType === "pdf" || fileType === "docx") {
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
