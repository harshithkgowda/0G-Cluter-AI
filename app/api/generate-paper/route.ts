import { type NextRequest, NextResponse } from "next/server"
import { parsePDF, getTemplateStructure } from "@/lib/pdf-parser"
import { generatePaperContent } from "@/lib/paper-content-generator"
import { generateIEEEPaper } from "@/lib/pdf-generator"
import { parseUserContent, parsePDFContent, mapContentToTemplate } from "@/lib/content-parser"

const BUILT_IN_TEMPLATES: Record<string, { structure: string; sections: string[] }> = {
  "ieee-conference": {
    structure: `Title: IEEE Conference Paper
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
    sections: ["INTRODUCTION", "RELATED WORK", "METHODOLOGY", "EXPERIMENTAL RESULTS", "DISCUSSION", "CONCLUSION"]
  },

  "ieee-journal": {
    structure: `Title: IEEE Journal Article
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
    sections: ["INTRODUCTION", "LITERATURE REVIEW", "PROPOSED METHOD", "EXPERIMENTAL SETUP", "RESULTS AND ANALYSIS", "DISCUSSION", "CONCLUSION"]
  },

  "acm-sigconf": {
    structure: `Title: ACM Conference Paper
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
    sections: ["INTRODUCTION", "BACKGROUND", "METHODOLOGY", "EVALUATION", "RESULTS", "RELATED WORK", "CONCLUSION"]
  },

  "springer-lncs": {
    structure: `Title: Springer LNCS Paper
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
    sections: ["INTRODUCTION", "PRELIMINARIES", "PROPOSED APPROACH", "EXPERIMENTS", "RESULTS", "CONCLUSION"]
  },
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const prompt = formData.get("prompt") as string | null
    const customTitle = formData.get("title") as string | null
    const customAuthors = formData.get("authors") as string | null
    const templateId = formData.get("templateId") as string | null
    
    // New: User content input (text or PDF)
    const userContentText = formData.get("userContent") as string | null
    const userContentFile = formData.get("userContentFile") as File | null
    const useUserContent = formData.get("useUserContent") === "true"

    // Validate inputs
    if (!useUserContent && !prompt) {
      return NextResponse.json({ error: "No research topic provided" }, { status: 400 })
    }

    if (!file && !templateId) {
      return NextResponse.json({ error: "No template selected or uploaded" }, { status: 400 })
    }

    console.log("[v0] Processing paper generation request")
    console.log("[v0] Use user content:", useUserContent)
    if (templateId) {
      console.log("[v0] Using built-in template:", templateId)
    } else if (file) {
      console.log("[v0] Processing uploaded PDF template:", file.name)
    }

    let templateStructure: string
    let templateSections: string[] = []

    // Get template structure
    if (templateId && BUILT_IN_TEMPLATES[templateId]) {
      templateStructure = BUILT_IN_TEMPLATES[templateId].structure
      templateSections = BUILT_IN_TEMPLATES[templateId].sections
      console.log("[v0] Using built-in template structure")
    } else if (file) {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        console.log("[v0] Parsing PDF structure...")
        const parsedTemplate = await parsePDF(buffer)
        templateStructure = getTemplateStructure(parsedTemplate)
        templateSections = parsedTemplate.sections.map(s => s.heading)
        console.log("[v0] Template structure:", templateStructure)
      } catch (parseError) {
        console.error("[v0] PDF parsing error, using default structure:", parseError)
        templateStructure = BUILT_IN_TEMPLATES["ieee-conference"].structure
        templateSections = BUILT_IN_TEMPLATES["ieee-conference"].sections
      }
    } else {
      templateStructure = BUILT_IN_TEMPLATES["ieee-conference"].structure
      templateSections = BUILT_IN_TEMPLATES["ieee-conference"].sections
    }

    let paperData: {
      title: string
      authors: string
      affiliations: string
      abstract: string
      keywords: string[]
      sections: { heading: string; content: string }[]
      references: string[]
    }

    // Check if we should use user-provided content
    if (useUserContent && (userContentText || userContentFile)) {
      console.log("[v0] Processing user-provided content...")
      
      let userContent
      
      if (userContentFile) {
        // Parse PDF content file
        const arrayBuffer = await userContentFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        userContent = await parsePDFContent(buffer)
        console.log("[v0] Parsed user PDF content, sections found:", userContent.sections.length)
      } else if (userContentText) {
        // Parse text content
        userContent = parseUserContent(userContentText)
        console.log("[v0] Parsed user text content, sections found:", userContent.sections.length)
      }
      
      if (!userContent) {
        return NextResponse.json({ error: "Failed to parse user content" }, { status: 400 })
      }

      // Map user content to template sections
      const mappedSections = mapContentToTemplate(userContent, templateSections)
      
      // Use user content directly, filling in missing parts
      paperData = {
        title: customTitle || userContent.title || "Conference Paper",
        authors: customAuthors || userContent.authors || "Author Name",
        affiliations: userContent.affiliations || "University / Institution",
        abstract: userContent.abstract || "[Abstract content]",
        keywords: userContent.keywords || ["keyword1", "keyword2", "keyword3"],
        sections: mappedSections,
        references: userContent.references || [
          "[1] Author, \"Title,\" in Proceedings, Year.",
          "[2] Author, \"Title,\" Journal, vol. X, Year."
        ],
      }

      console.log("[v0] User content mapped to template successfully")

    } else {
      // Generate content using AI
      console.log("[v0] Generating content with AI...")
      const generatedContent = await generatePaperContent(
        templateStructure,
        prompt!,
        customTitle || undefined,
        customAuthors || undefined,
      )

      console.log("[v0] Content generated successfully")

      paperData = {
        title: generatedContent.title,
        authors: customAuthors || "Author Name",
        affiliations: "University / Institution",
        abstract: generatedContent.abstract,
        keywords: generatedContent.keywords,
        sections: generatedContent.sections,
        references: generatedContent.references,
      }
    }

    // Generate PDF
    console.log("[v0] Generating PDF...")
    const pdfBytes = await generateIEEEPaper(paperData)

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
