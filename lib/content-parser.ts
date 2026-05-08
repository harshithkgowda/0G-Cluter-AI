// Content Parser - Extracts structured content from user-provided paper text or PDF
// This allows users to provide their own content and apply it to templates

export interface ParsedUserContent {
  title?: string
  authors?: string
  affiliations?: string
  abstract?: string
  keywords?: string[]
  sections: {
    heading: string
    content: string
  }[]
  references?: string[]
  rawText: string
}

// Common section heading patterns for academic papers
const SECTION_PATTERNS = [
  // Roman numerals: I., II., III., IV., V., etc.
  /^(?:(?:I{1,3}|IV|V|VI{1,3}|IX|X|XI{1,3})[.\s]+)([A-Z][A-Za-z\s&,-]+)/m,
  // Numbers: 1., 2., 3., etc.
  /^(?:\d+[.\s]+)([A-Z][A-Za-z\s&,-]+)/m,
  // Letters: A., B., C., etc. (subsections)
  /^(?:[A-Z][.\s]+)([A-Z][A-Za-z\s&,-]+)/m,
  // All caps headings without numbers
  /^([A-Z]{2,}(?:\s+[A-Z]+)*)\s*$/m,
]

// Standard section names to recognize
const STANDARD_SECTIONS = [
  'ABSTRACT',
  'INTRODUCTION',
  'BACKGROUND',
  'RELATED WORK',
  'RELATED WORKS',
  'LITERATURE REVIEW',
  'LITERATURE SURVEY',
  'METHODOLOGY',
  'METHODS',
  'PROPOSED METHOD',
  'PROPOSED APPROACH',
  'PROPOSED SYSTEM',
  'SYSTEM DESIGN',
  'IMPLEMENTATION',
  'EXPERIMENTAL SETUP',
  'EXPERIMENTS',
  'RESULTS',
  'RESULTS AND DISCUSSION',
  'DISCUSSION',
  'EVALUATION',
  'ANALYSIS',
  'CONCLUSION',
  'CONCLUSIONS',
  'FUTURE WORK',
  'ACKNOWLEDGMENT',
  'ACKNOWLEDGMENTS',
  'ACKNOWLEDGEMENT',
  'REFERENCES',
]

export function parseUserContent(text: string): ParsedUserContent {
  const lines = text.split('\n')
  const result: ParsedUserContent = {
    sections: [],
    rawText: text,
  }

  // Track current position
  let currentSection: { heading: string; content: string[] } | null = null
  let inAbstract = false
  let inReferences = false
  let headerComplete = false
  let lineIndex = 0

  // Try to extract title (usually first substantial line)
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim()
    if (line.length > 15 && line.length < 300 && !line.match(/^(abstract|keywords)/i)) {
      // Check if it looks like a title (not a section heading)
      if (!isStandardSection(line) && !line.match(/^\d+\./)) {
        result.title = line
        lineIndex = i + 1
        break
      }
    }
  }

  // Try to extract authors (line after title, typically contains names or email patterns)
  for (let i = lineIndex; i < Math.min(lineIndex + 5, lines.length); i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    // Check if it looks like author names
    if (line.match(/^[A-Z][a-z]+\s+[A-Z][a-z]+/) && !isStandardSection(line)) {
      result.authors = line
      lineIndex = i + 1
      break
    }
  }

  // Process remaining content
  for (let i = lineIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (!line) {
      if (currentSection) {
        currentSection.content.push('')
      }
      continue
    }

    // Check for abstract
    if (line.match(/^abstract[:\s]*/i)) {
      inAbstract = true
      inReferences = false
      headerComplete = true
      // Check if abstract content is on the same line
      const abstractContent = line.replace(/^abstract[:\s]*/i, '').trim()
      if (abstractContent) {
        result.abstract = abstractContent
      }
      continue
    }

    // Check for keywords
    if (line.match(/^keywords?[:\s-]*/i)) {
      inAbstract = false
      const keywordsContent = line.replace(/^keywords?[:\s-]*/i, '').trim()
      if (keywordsContent) {
        result.keywords = keywordsContent.split(/[,;]/).map(k => k.trim()).filter(k => k.length > 0)
      }
      continue
    }

    // Check for references section
    if (line.match(/^references?\s*$/i) || line.match(/^(?:I{1,3}|IV|V|VI{1,3}|IX|X|\d+)[.\s]+references?$/i)) {
      inReferences = true
      inAbstract = false
      if (currentSection && currentSection.content.length > 0) {
        result.sections.push({
          heading: currentSection.heading,
          content: currentSection.content.join('\n').trim(),
        })
      }
      currentSection = null
      result.references = []
      continue
    }

    // Handle references
    if (inReferences) {
      if (line.match(/^\[?\d+\]?[\.\s]/)) {
        result.references?.push(line)
      } else if (result.references && result.references.length > 0) {
        // Continue previous reference (multi-line)
        const lastIdx = result.references.length - 1
        result.references[lastIdx] += ' ' + line
      }
      continue
    }

    // Check if this is a section heading
    const sectionMatch = identifySection(line)
    if (sectionMatch) {
      inAbstract = false
      headerComplete = true
      
      // Save previous section
      if (currentSection && currentSection.content.length > 0) {
        result.sections.push({
          heading: currentSection.heading,
          content: currentSection.content.join('\n').trim(),
        })
      }
      
      currentSection = {
        heading: sectionMatch,
        content: [],
      }
      continue
    }

    // Handle abstract content
    if (inAbstract) {
      if (result.abstract) {
        result.abstract += ' ' + line
      } else {
        result.abstract = line
      }
      continue
    }

    // Regular content
    if (currentSection) {
      currentSection.content.push(line)
    } else if (!headerComplete) {
      // Still in header area, might be affiliations
      if (line.match(/(university|institute|department|school|college)/i)) {
        result.affiliations = result.affiliations ? result.affiliations + ', ' + line : line
      }
    }
  }

  // Don't forget the last section
  if (currentSection && currentSection.content.length > 0) {
    result.sections.push({
      heading: currentSection.heading,
      content: currentSection.content.join('\n').trim(),
    })
  }

  return result
}

function isStandardSection(text: string): boolean {
  const cleaned = text.replace(/^(?:I{1,3}|IV|V|VI{1,3}|IX|X|\d+)[.\s]+/i, '').trim().toUpperCase()
  return STANDARD_SECTIONS.some(s => cleaned.includes(s))
}

function identifySection(line: string): string | null {
  // Remove common prefixes
  let cleaned = line
    .replace(/^(?:I{1,3}|IV|V|VI{1,3}|IX|X|XI{1,3})[.\s]+/i, '')
    .replace(/^\d+[.\s]+/, '')
    .trim()

  // Check if it's a known section
  const upperCleaned = cleaned.toUpperCase()
  
  for (const section of STANDARD_SECTIONS) {
    if (upperCleaned === section || upperCleaned.startsWith(section + ' ') || upperCleaned.startsWith(section + ':')) {
      return section
    }
  }

  // Check if the line is all caps (likely a heading)
  if (line === line.toUpperCase() && line.length > 3 && line.length < 50 && !line.match(/^\d/)) {
    // Make sure it's not just numbers or special chars
    if (line.match(/[A-Z]{3,}/)) {
      return cleaned.toUpperCase()
    }
  }

  return null
}

// Parse PDF content (extracted text) and structure it
export async function parsePDFContent(buffer: Buffer): Promise<ParsedUserContent> {
  try {
    const pdfParse = await import("pdf-parse").then((m) => m.default || m)
    const data = await pdfParse(buffer)
    return parseUserContent(data.text)
  } catch (error) {
    console.error("[v0] Error parsing PDF content:", error)
    throw new Error("Failed to parse PDF content")
  }
}

// Map user content to template structure
export function mapContentToTemplate(
  userContent: ParsedUserContent,
  templateSections: string[]
): { heading: string; content: string }[] {
  const result: { heading: string; content: string }[] = []
  
  // Create a map of user sections for easy lookup
  const userSectionMap = new Map<string, string>()
  for (const section of userContent.sections) {
    // Normalize the heading for matching
    const normalizedHeading = normalizeHeading(section.heading)
    userSectionMap.set(normalizedHeading, section.content)
    
    // Also add variations
    const variations = getSectionVariations(normalizedHeading)
    for (const variation of variations) {
      if (!userSectionMap.has(variation)) {
        userSectionMap.set(variation, section.content)
      }
    }
  }

  // Map each template section to user content
  for (const templateSection of templateSections) {
    const normalizedTemplate = normalizeHeading(templateSection)
    let content = userSectionMap.get(normalizedTemplate)
    
    // Try variations if direct match not found
    if (!content) {
      const variations = getSectionVariations(normalizedTemplate)
      for (const variation of variations) {
        content = userSectionMap.get(variation)
        if (content) break
      }
    }
    
    // If still no match, try fuzzy matching
    if (!content) {
      for (const [userHeading, userContent] of userSectionMap) {
        if (fuzzyMatch(normalizedTemplate, userHeading)) {
          content = userContent
          break
        }
      }
    }

    result.push({
      heading: templateSection.toUpperCase(),
      content: content || `[Content for ${templateSection} section]`,
    })
  }

  return result
}

function normalizeHeading(heading: string): string {
  return heading
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/[^A-Z\s]/g, '')
    .trim()
}

function getSectionVariations(heading: string): string[] {
  const variations: string[] = []
  
  const mappings: Record<string, string[]> = {
    'INTRODUCTION': ['INTRO', 'BACKGROUND AND INTRODUCTION'],
    'RELATED WORK': ['RELATED WORKS', 'LITERATURE REVIEW', 'LITERATURE SURVEY', 'BACKGROUND'],
    'METHODOLOGY': ['METHODS', 'PROPOSED METHOD', 'PROPOSED APPROACH', 'APPROACH', 'SYSTEM DESIGN'],
    'RESULTS': ['EXPERIMENTAL RESULTS', 'EXPERIMENTS', 'EVALUATION'],
    'RESULTS AND DISCUSSION': ['RESULTS', 'DISCUSSION', 'ANALYSIS'],
    'DISCUSSION': ['ANALYSIS', 'RESULTS AND DISCUSSION'],
    'CONCLUSION': ['CONCLUSIONS', 'CONCLUDING REMARKS', 'SUMMARY'],
    'CONCLUSIONS': ['CONCLUSION', 'CONCLUDING REMARKS', 'SUMMARY'],
  }
  
  if (mappings[heading]) {
    variations.push(...mappings[heading])
  }
  
  // Reverse mappings
  for (const [key, values] of Object.entries(mappings)) {
    if (values.includes(heading) && !variations.includes(key)) {
      variations.push(key)
    }
  }
  
  return variations
}

function fuzzyMatch(a: string, b: string): boolean {
  // Simple fuzzy matching - check if one contains significant part of the other
  const wordsA = a.split(' ').filter(w => w.length > 3)
  const wordsB = b.split(' ').filter(w => w.length > 3)
  
  let matches = 0
  for (const wordA of wordsA) {
    if (wordsB.some(wordB => wordA.includes(wordB) || wordB.includes(wordA))) {
      matches++
    }
  }
  
  return matches >= Math.min(wordsA.length, wordsB.length) * 0.5
}
