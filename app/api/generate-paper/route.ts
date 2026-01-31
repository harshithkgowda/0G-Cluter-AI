import { type NextRequest, NextResponse } from "next/server"
import { parsePDF, getTemplateStructure } from "@/lib/pdf-parser"
import { generatePaperContent } from "@/lib/paper-content-generator"
import { generateIEEEPaper } from "@/lib/pdf-generator"

const BUILT_IN_TEMPLATES: Record<string, string> = {
  "ieee-conference": `Title: IEEE Conference Paper
Authors: Author Name - Institution
Sections:
- ABSTRACT
- INTRODUCTION
- RELATED WORK
- METHODOLOGY
- EXPERIMENTAL RESULTS
- DISCUSSION
- CONCLUSION
- REFERENCES`,

  "ieee-journal": `Title: IEEE Journal Article
Authors: Author Name - Institution
Sections:
- ABSTRACT
- INTRODUCTION
- LITERATURE REVIEW
- PROPOSED METHOD
- EXPERIMENTAL SETUP
- RESULTS AND ANALYSIS
- DISCUSSION
- CONCLUSION
- ACKNOWLEDGMENTS
- REFERENCES`,

  "acm-sigconf": `Title: ACM Conference Paper
Authors: Author Name - Institution
Sections:
- ABSTRACT
- CCS CONCEPTS
- KEYWORDS
- INTRODUCTION
- BACKGROUND
- METHODOLOGY
- EVALUATION
- RESULTS
- RELATED WORK
- CONCLUSION
- REFERENCES`,

  "springer-lncs": `Title: Springer LNCS Paper
Authors: Author Name - Institution
Sections:
- ABSTRACT
- INTRODUCTION
- PRELIMINARIES
- PROPOSED APPROACH
- EXPERIMENTS
- RESULTS
- CONCLUSION
- REFERENCES`,
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const prompt = formData.get("prompt") as string | null
    const customTitle = formData.get("title") as string | null
    const customAuthors = formData.get("authors") as string | null
    const templateId = formData.get("templateId") as string | null

    if (!prompt) {
      return NextResponse.json({ error: "No research topic provided" }, { status: 400 })
    }

    if (!file && !templateId) {
      return NextResponse.json({ error: "No template selected or uploaded" }, { status: 400 })
    }

    console.log("[v0] Processing paper generation request")
    if (templateId) {
      console.log("[v0] Using built-in template:", templateId)
    } else if (file) {
      console.log("[v0] Processing uploaded PDF template:", file.name)
    }

    let templateStructure: string

    if (templateId && BUILT_IN_TEMPLATES[templateId]) {
      templateStructure = BUILT_IN_TEMPLATES[templateId]
      console.log("[v0] Using built-in template structure")
    } else if (file) {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        console.log("[v0] Parsing PDF structure...")
        const parsedTemplate = await parsePDF(buffer)
        templateStructure = getTemplateStructure(parsedTemplate)
        console.log("[v0] Template structure:", templateStructure)
      } catch (parseError) {
        console.error("[v0] PDF parsing error, using default structure:", parseError)
        templateStructure = BUILT_IN_TEMPLATES["ieee-conference"]
      }
    } else {
      templateStructure = BUILT_IN_TEMPLATES["ieee-conference"]
    }

    // Generate content using AI
    console.log("[v0] Generating content with AI...")
    const generatedContent = await generatePaperContent(
      templateStructure,
      prompt,
      customTitle || undefined,
      customAuthors || undefined,
    )

    console.log("[v0] Content generated successfully")

    // Generate PDF
    console.log("[v0] Generating PDF...")
    const pdfBytes = await generateIEEEPaper({
      title: generatedContent.title,
      authors: customAuthors || "Author Name",
      affiliations: "University / Institution",
      abstract: generatedContent.abstract,
      keywords: generatedContent.keywords,
      sections: generatedContent.sections,
      references: generatedContent.references,
    })

    console.log("[v0] PDF generated successfully, size:", pdfBytes.length)

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="ai-conference-paper.pdf"',
      },
    })
  } catch (error) {
    console.error("[v0] Error in generate-paper API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate paper" },
      { status: 500 },
    )
  }
}
