import { type NextRequest, NextResponse } from "next/server"
import PizZip from "pizzip"
import { DOMParser, XMLSerializer } from "@xmldom/xmldom"

interface DocumentSection {
  heading: string
  content: string
}

interface GeneratedDocContent {
  sections: DocumentSection[]
}

/**
 * Generate document content using OpenRouter's Gemini 2.0
 */
async function generateDocumentContent(prompt: string, existingSections: string[]): Promise<GeneratedDocContent> {
  const apiKey = process.env.OPENROUTER_API_KEY?.replace(/\s/g, "")

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured")
  }

  const sectionsContext =
    existingSections.length > 0
      ? `The document has these existing sections: ${existingSections.join(", ")}`
      : "Create appropriate sections for the document"

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": "DocuGen AI",
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001",
      messages: [
        {
          role: "system",
          content: `You are an expert document writer. Generate professional content for documents.
${sectionsContext}

Return ONLY valid JSON with this structure:
{
  "sections": [
    {
      "heading": "Section Heading",
      "content": "Detailed content for this section..."
    }
  ]
}

Keep content professional, well-structured, and relevant to the topic.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
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

  return JSON.parse(jsonContent)
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

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i]
    const pStyle = para.getElementsByTagName("w:pStyle")[0]
    const textElements = para.getElementsByTagName("w:t")

    if (pStyle) {
      const styleVal = pStyle.getAttribute("w:val")

      // Check if this is a heading
      if (styleVal && (styleVal.includes("Heading") || styleVal.includes("Title"))) {
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
            textElements[0].textContent = section.content
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
        textElements[0].textContent = section.content
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

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    if (!prompt) {
      return NextResponse.json({ error: "No prompt provided" }, { status: 400 })
    }

    console.log("[v0] Processing Word document:", file.name)

    // Read the DOCX file
    const arrayBuffer = await file.arrayBuffer()
    const zip = new PizZip(arrayBuffer)

    // Get the main document XML
    const documentXml = zip.file("word/document.xml")?.asText()

    if (!documentXml) {
      return NextResponse.json({ error: "Invalid DOCX file" }, { status: 400 })
    }

    // Extract existing sections
    const existingSections = extractDocxSections(documentXml)
    console.log("[v0] Found existing sections:", existingSections)

    // Generate new content
    const generatedContent = await generateDocumentContent(prompt, existingSections)
    console.log("[v0] Generated", generatedContent.sections.length, "sections")

    // Replace content in the document
    const modifiedXml = replaceDocxContent(documentXml, generatedContent)
    zip.file("word/document.xml", modifiedXml)

    // Generate the modified DOCX
    const outputBuffer = zip.generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    })

    return new NextResponse(outputBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="ai-generated-document.docx"`,
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
