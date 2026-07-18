// PDF Parser - Extracts text and structure from PDF templates

export interface PaperSection {
  heading: string
  content: string
  level: number // 1 for main sections (I, II, III), 2 for subsections (A, B, C)
}

export interface ParsedPaper {
  title: string
  authors: string[]
  affiliations: string[]
  abstract: string
  keywords: string[]
  sections: PaperSection[]
  references: string[]
  fullText: string
}

// Default IEEE paper structure when parsing fails or for new papers
const DEFAULT_SECTIONS: PaperSection[] = [
  { heading: "INTRODUCTION", content: "", level: 1 },
  { heading: "RELATED WORKS", content: "", level: 1 },
  { heading: "METHODOLOGY", content: "", level: 1 },
  { heading: "RESULTS AND DISCUSSION", content: "", level: 1 },
  { heading: "CONCLUSION", content: "", level: 1 },
]

export async function parsePDF(buffer: Buffer): Promise<ParsedPaper> {
  try {
    // Try to dynamically import pdf-parse
    const pdfParseModule = await import("pdf-parse")
    // pdf-parse v2 exports the function directly in ESM; fall back to .default for CJS interop
    const pdfParse = (pdfParseModule as unknown as (buf: Buffer) => Promise<{ text: string }>)
    const data = await pdfParse(buffer)
    const text = data.text

    console.log("[v0] PDF parsed successfully, text length:", text.length)

    // Extract components
    const title = extractTitle(text)
    const authors = extractAuthors(text)
    const affiliations = extractAffiliations(text)
    const abstract = extractAbstract(text)
    const keywords = extractKeywords(text)
    const sections = extractSections(text)
    const references = extractReferences(text)

    return {
      title,
      authors,
      affiliations,
      abstract,
      keywords,
      sections: sections.length > 0 ? sections : DEFAULT_SECTIONS,
      references,
      fullText: text,
    }
  } catch (error) {
    console.error("[v0] Error parsing PDF, using default structure:", error)
    // Return default structure if parsing fails
    return {
      title: "Conference Paper",
      authors: ["Author Name"],
      affiliations: ["Institution"],
      abstract: "",
      keywords: [],
      sections: DEFAULT_SECTIONS,
      references: [],
      fullText: "",
    }
  }
}

function extractTitle(text: string): string {
  // Title is usually the first significant text, often in uppercase
  const lines = text.split("\n").filter((line) => line.trim().length > 0)

  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim()
    // Skip conference headers and dates
    if (line.match(/\d{4}\s*(IEEE|ACM|Conference)/i)) continue
    if (line.match(/978-\d/)) continue // ISBN
    if (line.length > 20 && line.length < 200) {
      // Check if it looks like a title (mostly uppercase or title case)
      if (line === line.toUpperCase() || /^[A-Z]/.test(line)) {
        return line
      }
    }
  }

  return "Conference Paper Title"
}

function extractAuthors(text: string): string[] {
  const authors: string[] = []
  const lines = text.split("\n")

  // Look for author names after title, before abstract
  let foundTitle = false
  for (let i = 0; i < Math.min(30, lines.length); i++) {
    const line = lines[i].trim()

    if (line.length > 20) foundTitle = true
    if (!foundTitle) continue

    // Stop at abstract
    if (line.match(/^abstract/i)) break

    // Author names typically have format: First Last or email patterns nearby
    if (line.match(/@.*\.(edu|com|org)/)) {
      // This line has email, previous line might have author name
      if (i > 0 && lines[i - 1].trim().length > 3) {
        const potentialAuthor = lines[i - 1].trim()
        if (!potentialAuthor.match(/(University|School|Department|Institute)/i)) {
          authors.push(potentialAuthor)
        }
      }
    }

    // Names with common patterns
    const nameMatch = line.match(/^([A-Z][a-z]+\s+[A-Z][a-z]+)(\s*,\s*[A-Z][a-z]+\s+[A-Z][a-z]+)*$/)
    if (nameMatch) {
      const names = line.split(/\s*,\s*/)
      authors.push(...names.filter((n) => n.length > 3))
    }
  }

  return authors.length > 0 ? authors : ["Author Name"]
}

function extractAffiliations(text: string): string[] {
  const affiliations: string[] = []
  const lines = text.split("\n")

  for (let i = 0; i < Math.min(40, lines.length); i++) {
    const line = lines[i].trim()
    if (line.match(/^abstract/i)) break

    if (line.match(/(University|School|Department|Institute|College)/i)) {
      affiliations.push(line)
    }
  }

  return affiliations
}

function extractAbstract(text: string): string {
  const abstractMatch = text.match(/abstract[:\s]*(.+?)(?=keywords|introduction|I\.\s|1\.\s)/is)
  if (abstractMatch) {
    return abstractMatch[1].replace(/\s+/g, " ").trim()
  }
  return ""
}

function extractKeywords(text: string): string[] {
  const keywordsMatch = text.match(/keywords[:\s-]*(.+?)(?=\n\s*\n|introduction|I\.\s|1\.\s)/is)
  if (keywordsMatch) {
    const keywordsText = keywordsMatch[1].trim()
    return keywordsText
      .split(/[,;]/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0 && k.length < 50)
  }
  return []
}

function extractSections(text: string): PaperSection[] {
  const sections: PaperSection[] = []

  // Split by common section patterns
  const sectionRegex =
    /(?:^|\n)((?:I{1,3}|IV|V|VI{1,3}|IX|X|\d+)[.\s]+[A-Z][A-Z\s]+|(?:INTRODUCTION|METHODOLOGY|METHODS|RELATED WORK|LITERATURE SURVEY|RESULTS|DISCUSSION|CONCLUSION|CONCLUSIONS|ACKNOWLEDGMENT))/gim

  const matches = [...text.matchAll(sectionRegex)]

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const heading = match[1].trim()
    const startIndex = match.index! + match[0].length
    const endIndex = i < matches.length - 1 ? matches[i + 1].index! : text.length

    let content = text.slice(startIndex, endIndex).trim()

    // Clean up content
    content = content.replace(/\s+/g, " ").replace(/\n+/g, "\n").trim()

    // Skip references section for now
    if (heading.match(/references/i)) continue

    sections.push({
      heading: cleanHeading(heading),
      content: content.slice(0, 2000), // Limit content length
      level: heading.match(/^[A-Z]\./) ? 2 : 1,
    })
  }

  return sections
}

function cleanHeading(heading: string): string {
  // Remove Roman numerals and numbers from the beginning
  return heading
    .replace(/^(I{1,3}|IV|V|VI{1,3}|IX|X|\d+)[.\s]+/i, "")
    .trim()
    .toUpperCase()
}

function extractReferences(text: string): string[] {
  const references: string[] = []

  const referencesMatch = text.match(/references\s*\n(.+)$/is)
  if (referencesMatch) {
    const refText = referencesMatch[1]
    // Split by reference numbers [1], [2], etc.
    const refMatches = refText.split(/\[\d+\]/)
    for (const ref of refMatches) {
      const cleaned = ref.replace(/\s+/g, " ").trim()
      if (cleaned.length > 20) {
        references.push(cleaned)
      }
    }
  }

  return references
}

export function getTemplateStructure(parsed: ParsedPaper): string {
  const structure: string[] = []

  structure.push(`Title: ${parsed.title}`)
  structure.push(`Authors: ${parsed.authors.join(", ")}`)
  if (parsed.affiliations.length > 0) {
    structure.push(`Affiliations: ${parsed.affiliations.join("; ")}`)
  }
  if (parsed.abstract) {
    structure.push(`Abstract: ${parsed.abstract.slice(0, 200)}...`)
  }
  if (parsed.keywords.length > 0) {
    structure.push(`Keywords: ${parsed.keywords.join(", ")}`)
  }

  structure.push("\nSections:")
  for (const section of parsed.sections) {
    const prefix = section.level === 1 ? "- " : "  - "
    structure.push(`${prefix}${section.heading}`)
  }

  return structure.join("\n")
}
