import { type NextRequest, NextResponse } from "next/server"
import PizZip from "pizzip"
import { DOMParser, XMLSerializer } from "@xmldom/xmldom"

interface DocumentSection {
  heading: string
  content: string
  subsections?: { heading: string; content: string }[]
}

interface GeneratedDocContent {
  title: string
  abstract?: string
  sections: DocumentSection[]
}

/**
 * Generate document content using OpenRouter's Gemini 2.0 Flash
 */
async function generateDocumentContent(
  prompt: string, 
  existingSections: string[],
  documentType: string
): Promise<GeneratedDocContent> {
  const apiKey = process.env.OPENROUTER_API_KEY?.replace(/\s/g, "")

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured")
  }

  const sectionsContext =
    existingSections.length > 0
      ? `Match these existing sections exactly: ${existingSections.join(", ")}`
      : "Create appropriate professional sections"

  const documentTypePrompts: Record<string, string> = {
    report: "Create a professional business report with executive summary, findings, analysis, and recommendations.",
    proposal: "Create a compelling project proposal with objectives, methodology, timeline, budget, and expected outcomes.",
    article: "Create an engaging article with introduction, main body with clear arguments, and conclusion.",
    research: "Create a research document with abstract, introduction, literature review, methodology, results, discussion, and conclusion.",
    default: "Create a well-structured professional document with clear sections and detailed content."
  }

  const typeGuidance = documentTypePrompts[documentType] || documentTypePrompts.default

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": "DocuGen AI Word Generator",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are an expert document writer and content strategist. ${typeGuidance}

${sectionsContext}

Generate comprehensive, professional content that:
1. Uses clear, engaging headings that capture the main idea
2. Provides detailed, well-researched content for each section (200-400 words per section)
3. Includes specific examples, data points, and actionable insights
4. Maintains professional tone throughout
5. Uses proper transitions between sections
6. Includes subsections where appropriate for complex topics

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "title": "Document Title",
  "abstract": "Brief summary of the document (2-3 sentences)",
  "sections": [
    {
      "heading": "Section Heading",
      "content": "Detailed professional content for this section with multiple paragraphs...",
      "subsections": [
        {
          "heading": "Subsection Heading",
          "content": "Subsection content..."
        }
      ]
    }
  ]
}

Make content substantive, informative, and professionally written.`,
        },
        {
          role: "user",
          content: `Create a professional document about: ${prompt}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 6000,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error("[v0] OpenRouter API error:", response.status, error)
    throw new Error(`AI API failed: ${response.status} - ${error}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content

  if (!content) {
    throw new Error("No content generated from AI")
  }

  let jsonContent = content.trim()
  if (jsonContent.startsWith("```json")) {
    jsonContent = jsonContent.replace(/```json\n?/g, "").replace(/```\n?$/g, "")
  } else if (jsonContent.startsWith("```")) {
    jsonContent = jsonContent.replace(/```\n?/g, "")
  }

  try {
    const parsed = JSON.parse(jsonContent)
    console.log(`[v0] Generated document with ${parsed.sections?.length || 0} sections`)
    return parsed
  } catch (error) {
    console.error("[v0] Failed to parse AI response:", jsonContent.substring(0, 500))
    throw new Error("Failed to parse AI-generated content")
  }
}

/**
 * Extract text elements from DOCX XML
 */
function extractDocxSections(xmlString: string): string[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, "text/xml")
  const sections: string[] = []

  // Find paragraph styles that indicate headings
  const paragraphs = doc.getElementsByTagName("w:p")

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i]
    const pStyle = para.getElementsByTagName("w:pStyle")[0]

    if (pStyle) {
      const styleVal = pStyle.getAttribute("w:val")
      if (styleVal && (styleVal.includes("Heading") || styleVal.includes("Title"))) {
        const textElements = para.getElementsByTagName("w:t")
        let text = ""
        for (let j = 0; j < textElements.length; j++) {
          text += textElements[j].textContent || ""
        }
        if (text.trim()) {
          sections.push(text.trim())
        }
      }
    }
  }

  return sections
}

/**
 * Create XML for a new paragraph with text
 */
function createParagraphXml(text: string, style?: string): string {
  const styleXml = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ""
  return `<w:p>${styleXml}<w:r><w:t>${escapeXml(text)}</w:t></w:r></w:p>`
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/**
 * Replace text content in DOCX while preserving formatting
 */
function replaceDocxContent(xmlString: string, generatedContent: GeneratedDocContent): string {
  const parser = new DOMParser()
  const serializer = new XMLSerializer()
  const doc = parser.parseFromString(xmlString, "text/xml")

  const paragraphs = doc.getElementsByTagName("w:p")
  let currentSectionIndex = 0
  let isInSection = false
  let contentPlaced = false
  let titlePlaced = false

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i]
    const pStyle = para.getElementsByTagName("w:pStyle")[0]
    const textElements = para.getElementsByTagName("w:t")

    if (pStyle) {
      const styleVal = pStyle.getAttribute("w:val")

      // Check if this is the document title
      if (styleVal && styleVal.includes("Title") && !titlePlaced) {
        if (textElements.length > 0) {
          textElements[0].textContent = generatedContent.title || "Generated Document"
          for (let j = 1; j < textElements.length; j++) {
            textElements[j].textContent = ""
          }
          titlePlaced = true
        }
        continue
      }

      // Check if this is a heading
      if (styleVal && styleVal.includes("Heading")) {
        // Replace heading text if we have a matching section
        if (currentSectionIndex < generatedContent.sections.length) {
          const section = generatedContent.sections[currentSectionIndex]
          if (textElements.length > 0) {
            textElements[0].textContent = section.heading
            // Clear other text elements in the heading
            for (let j = 1; j < textElements.length; j++) {
              textElements[j].textContent = ""
            }
          }
          isInSection = true
          contentPlaced = false
        }
      } else if (isInSection && !contentPlaced) {
        // This is content paragraph after a heading
        if (currentSectionIndex < generatedContent.sections.length) {
          const section = generatedContent.sections[currentSectionIndex]
          if (textElements.length > 0) {
            // Split content into paragraphs for better formatting
            const paragraphContent = section.content.split('\n\n')[0] || section.content
            textElements[0].textContent = paragraphContent
            // Clear other text elements
            for (let j = 1; j < textElements.length; j++) {
              textElements[j].textContent = ""
            }
            contentPlaced = true
            currentSectionIndex++
            isInSection = false
          }
        }
      }
    } else if (isInSection && !contentPlaced && textElements.length > 0) {
      // Regular paragraph in a section
      if (currentSectionIndex < generatedContent.sections.length) {
        const section = generatedContent.sections[currentSectionIndex]
        const paragraphContent = section.content.split('\n\n')[0] || section.content
        textElements[0].textContent = paragraphContent
        for (let j = 1; j < textElements.length; j++) {
          textElements[j].textContent = ""
        }
        contentPlaced = true
        currentSectionIndex++
        isInSection = false
      }
    }
  }

  return serializer.serializeToString(doc)
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const prompt = formData.get("prompt") as string
    const documentType = (formData.get("documentType") as string) || "default"

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    if (!prompt) {
      return NextResponse.json({ error: "No prompt provided" }, { status: 400 })
    }

    console.log("[v0] Processing Word document:", file.name)
    console.log("[v0] Document type:", documentType)
    console.log("[v0] Prompt:", prompt.substring(0, 100))

    // Read the DOCX file
    const arrayBuffer = await file.arrayBuffer()
    const zip = new PizZip(arrayBuffer)

    // Get the main document XML
    const documentXml = zip.file("word/document.xml")?.asText()

    if (!documentXml) {
      return NextResponse.json({ error: "Invalid DOCX file" }, { status: 400 })
    }

    // Extract existing sections from template
    const existingSections = extractDocxSections(documentXml)
    console.log("[v0] Found existing sections:", existingSections)

    // Generate new content with AI
    console.log("[v0] Generating content with Gemini 2.5 Flash...")
    const generatedContent = await generateDocumentContent(prompt, existingSections, documentType)
    console.log("[v0] Generated content:")
    console.log("[v0]   - Title:", generatedContent.title)
    console.log("[v0]   - Sections:", generatedContent.sections.length)

    // Replace content in the document while preserving template formatting
    console.log("[v0] Replacing template content...")
    const modifiedXml = replaceDocxContent(documentXml, generatedContent)
    zip.file("word/document.xml", modifiedXml)

    // Generate the modified DOCX
    const outputBuffer = zip.generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    })

    console.log("[v0] Successfully generated document, size:", outputBuffer.length)

    return new NextResponse(outputBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="ai-generated-${file.name}"`,
      },
    })
  } catch (error) {
    console.error("[v0] Error processing Word document:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process document" },
      { status: 500 },
    )
  }
}
