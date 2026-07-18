// PDF Generator - Creates IEEE-style conference papers with proper text alignment
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib"

interface PaperContent {
  title: string
  authors: string
  affiliations: string
  abstract: string
  keywords: string[]
  sections: {
    heading: string
    content: string
  }[]
  references: string[]
}

// Page dimensions (Letter size)
const PAGE_WIDTH = 612
const PAGE_HEIGHT = 792
const MARGIN_LEFT = 54
const MARGIN_RIGHT = 54
const MARGIN_TOP = 72
const MARGIN_BOTTOM = 72

// Two-column layout
const COLUMN_GAP = 18
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT
const COLUMN_WIDTH = (CONTENT_WIDTH - COLUMN_GAP) / 2

// Typography
const TITLE_FONT_SIZE = 14
const TITLE_LINE_HEIGHT = 18
const AUTHOR_FONT_SIZE = 11
const AUTHOR_LINE_HEIGHT = 14
const AFFILIATION_FONT_SIZE = 10
const AFFILIATION_LINE_HEIGHT = 13
const ABSTRACT_FONT_SIZE = 9
const ABSTRACT_LINE_HEIGHT = 11
const BODY_FONT_SIZE = 9
const BODY_LINE_HEIGHT = 11
const HEADING_FONT_SIZE = 10
const REFERENCE_FONT_SIZE = 8
const REFERENCE_LINE_HEIGHT = 10

// Spacing
const SPACE_AFTER_TITLE = 14
const SPACE_AFTER_AUTHORS = 6
const SPACE_AFTER_AFFILIATIONS = 20
const SPACE_AFTER_ABSTRACT_HEADING = 8
const SPACE_AFTER_ABSTRACT = 10
const SPACE_AFTER_KEYWORDS = 20
const SPACE_BEFORE_SECTION = 12
const SPACE_AFTER_HEADING = 8
const PARAGRAPH_INDENT = 18
const PARAGRAPH_SPACING = 6

export async function generateIEEEPaper(content: PaperContent): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()

  // Embed fonts
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
  const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)

  // Track current page and position
  let currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let yPosition = PAGE_HEIGHT - MARGIN_TOP
  let currentColumn = 0 // 0 = left, 1 = right
  let twoColumnStartY = 0 // Will be set after header is complete

  // Helper: Get X position for current column
  const getColumnX = (col: number): number => {
    return col === 0 ? MARGIN_LEFT : MARGIN_LEFT + COLUMN_WIDTH + COLUMN_GAP
  }

  // Helper: Add new page
  const addNewPage = (): PDFPage => {
    currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    yPosition = PAGE_HEIGHT - MARGIN_TOP
    currentColumn = 0
    return currentPage
  }

  // Helper: Wrap text into lines that fit within maxWidth
  const wrapText = (text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] => {
    if (!text || text.trim().length === 0) return []
    
    const words = text.replace(/\s+/g, ' ').trim().split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      if (!word) continue
      
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const testWidth = font.widthOfTextAtSize(testLine, fontSize)

      if (testWidth <= maxWidth) {
        currentLine = testLine
      } else {
        if (currentLine) {
          lines.push(currentLine)
        }
        
        // Handle words that are too long for one line
        const wordWidth = font.widthOfTextAtSize(word, fontSize)
        if (wordWidth > maxWidth) {
          // Break the word character by character
          let chars = ''
          for (const char of word) {
            const charTestWidth = font.widthOfTextAtSize(chars + char, fontSize)
            if (charTestWidth > maxWidth && chars) {
              lines.push(chars)
              chars = char
            } else {
              chars += char
            }
          }
          currentLine = chars
        } else {
          currentLine = word
        }
      }
    }
    
    if (currentLine) {
      lines.push(currentLine)
    }

    return lines
  }

  // Helper: Draw centered text and return height used
  const drawCenteredText = (
    text: string,
    font: PDFFont,
    fontSize: number,
    lineHeight: number,
    maxWidth: number
  ): number => {
    const lines = wrapText(text, font, fontSize, maxWidth)
    let heightUsed = 0

    for (const line of lines) {
      const textWidth = font.widthOfTextAtSize(line, fontSize)
      const xPos = (PAGE_WIDTH - textWidth) / 2

      currentPage.drawText(line, {
        x: Math.max(MARGIN_LEFT, xPos),
        y: yPosition,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      })

      yPosition -= lineHeight
      heightUsed += lineHeight
    }

    return heightUsed
  }

  // Helper: Draw left-aligned text (full width) and return height used
  const drawFullWidthText = (
    text: string,
    font: PDFFont,
    fontSize: number,
    lineHeight: number,
    xOffset: number = 0
  ): number => {
    const maxWidth = CONTENT_WIDTH - xOffset
    const lines = wrapText(text, font, fontSize, maxWidth)
    let heightUsed = 0

    for (const line of lines) {
      if (yPosition < MARGIN_BOTTOM) {
        addNewPage()
      }

      currentPage.drawText(line, {
        x: MARGIN_LEFT + xOffset,
        y: yPosition,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      })

      yPosition -= lineHeight
      heightUsed += lineHeight
    }

    return heightUsed
  }

  // Helper: Check space in current column and switch/add page if needed
  const checkColumnSpace = (neededHeight: number): void => {
    if (yPosition - neededHeight < MARGIN_BOTTOM) {
      if (currentColumn === 0) {
        // Switch to right column
        currentColumn = 1
        yPosition = twoColumnStartY
      } else {
        // Add new page and reset to left column
        addNewPage()
        twoColumnStartY = yPosition
      }
    }
  }

  // Helper: Draw column text and return height used
  const drawColumnText = (
    text: string,
    font: PDFFont,
    fontSize: number,
    lineHeight: number,
    indent: number = 0
  ): number => {
    const maxWidth = COLUMN_WIDTH - indent
    const lines = wrapText(text, font, fontSize, maxWidth)
    let heightUsed = 0

    for (let i = 0; i < lines.length; i++) {
      checkColumnSpace(lineHeight)

      const xPos = getColumnX(currentColumn) + (i === 0 ? indent : 0)

      currentPage.drawText(lines[i], {
        x: xPos,
        y: yPosition,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      })

      yPosition -= lineHeight
      heightUsed += lineHeight
    }

    return heightUsed
  }

  // ============================================================
  // HEADER SECTION (Full Width, Centered)
  // ============================================================

  // Title
  const titleText = content.title.toUpperCase()
  drawCenteredText(titleText, timesBold, TITLE_FONT_SIZE, TITLE_LINE_HEIGHT, CONTENT_WIDTH - 40)
  yPosition -= SPACE_AFTER_TITLE

  // Authors
  if (content.authors && content.authors.trim()) {
    drawCenteredText(content.authors, timesRoman, AUTHOR_FONT_SIZE, AUTHOR_LINE_HEIGHT, CONTENT_WIDTH - 20)
    yPosition -= SPACE_AFTER_AUTHORS
  }

  // Affiliations
  if (content.affiliations && content.affiliations.trim()) {
    drawCenteredText(content.affiliations, timesItalic, AFFILIATION_FONT_SIZE, AFFILIATION_LINE_HEIGHT, CONTENT_WIDTH - 20)
  }
  yPosition -= SPACE_AFTER_AFFILIATIONS

  // ============================================================
  // ABSTRACT SECTION (Full Width)
  // ============================================================

  // Abstract heading (bold, italic)
  currentPage.drawText("Abstract—", {
    x: MARGIN_LEFT,
    y: yPosition,
    size: ABSTRACT_FONT_SIZE,
    font: timesBold,
    color: rgb(0, 0, 0),
  })

  // Get width of "Abstract—" to start content after it
  const abstractLabelWidth = timesBold.widthOfTextAtSize("Abstract—", ABSTRACT_FONT_SIZE)
  
  // Draw abstract content inline after the label
  const abstractText = content.abstract || ""
  const firstLineMaxWidth = CONTENT_WIDTH - abstractLabelWidth - 4
  const abstractWords = abstractText.replace(/\s+/g, ' ').trim().split(' ')
  
  // Build first line that fits after "Abstract—"
  let firstLine = ''
  let remainingWords: string[] = []
  let foundBreak = false
  
  for (let i = 0; i < abstractWords.length; i++) {
    const testLine = firstLine ? `${firstLine} ${abstractWords[i]}` : abstractWords[i]
    const testWidth = timesItalic.widthOfTextAtSize(testLine, ABSTRACT_FONT_SIZE)
    
    if (testWidth <= firstLineMaxWidth) {
      firstLine = testLine
    } else {
      remainingWords = abstractWords.slice(i)
      foundBreak = true
      break
    }
  }
  
  if (!foundBreak) {
    remainingWords = []
  }

  // Draw first line of abstract (inline with "Abstract—")
  if (firstLine) {
    currentPage.drawText(firstLine, {
      x: MARGIN_LEFT + abstractLabelWidth + 4,
      y: yPosition,
      size: ABSTRACT_FONT_SIZE,
      font: timesItalic,
      color: rgb(0, 0, 0),
    })
  }
  yPosition -= ABSTRACT_LINE_HEIGHT

  // Draw remaining abstract lines
  if (remainingWords.length > 0) {
    const remainingText = remainingWords.join(' ')
    drawFullWidthText(remainingText, timesItalic, ABSTRACT_FONT_SIZE, ABSTRACT_LINE_HEIGHT)
  }

  yPosition -= SPACE_AFTER_ABSTRACT

  // ============================================================
  // KEYWORDS SECTION (Full Width)
  // ============================================================

  if (content.keywords && content.keywords.length > 0) {
    const keywordsLabel = "Keywords—"
    currentPage.drawText(keywordsLabel, {
      x: MARGIN_LEFT,
      y: yPosition,
      size: ABSTRACT_FONT_SIZE,
      font: timesBold,
      color: rgb(0, 0, 0),
    })

    const keywordsLabelWidth = timesBold.widthOfTextAtSize(keywordsLabel, ABSTRACT_FONT_SIZE)
    const keywordsText = content.keywords.join(", ")

    currentPage.drawText(keywordsText, {
      x: MARGIN_LEFT + keywordsLabelWidth + 4,
      y: yPosition,
      size: ABSTRACT_FONT_SIZE,
      font: timesItalic,
      color: rgb(0, 0, 0),
    })

    yPosition -= ABSTRACT_LINE_HEIGHT
  }

  yPosition -= SPACE_AFTER_KEYWORDS

  // ============================================================
  // MARK THE START OF TWO-COLUMN CONTENT
  // This is the critical point - all content below uses two columns
  // ============================================================
  twoColumnStartY = yPosition
  currentColumn = 0

  // ============================================================
  // MAIN CONTENT SECTIONS (Two Columns)
  // ============================================================

  let sectionNumber = 1

  for (const section of content.sections) {
    // Add space before section
    checkColumnSpace(SPACE_BEFORE_SECTION + HEADING_FONT_SIZE + SPACE_AFTER_HEADING)
    
    if (sectionNumber > 1) {
      yPosition -= SPACE_BEFORE_SECTION
    }

    // Section heading (e.g., "I. INTRODUCTION")
    const headingText = `${toRoman(sectionNumber)}. ${section.heading.toUpperCase()}`
    
    currentPage.drawText(headingText, {
      x: getColumnX(currentColumn),
      y: yPosition,
      size: HEADING_FONT_SIZE,
      font: timesBold,
      color: rgb(0, 0, 0),
    })

    yPosition -= BODY_LINE_HEIGHT + SPACE_AFTER_HEADING

    // Section content - split into paragraphs
    const paragraphs = section.content.split(/\n\n+/).filter(p => p.trim())

    for (let pIndex = 0; pIndex < paragraphs.length; pIndex++) {
      const paragraph = paragraphs[pIndex].replace(/\n/g, ' ').trim()
      if (!paragraph) continue

      // First paragraph after heading has indent
      const useIndent = pIndex === 0 ? PARAGRAPH_INDENT : PARAGRAPH_INDENT

      const lines = wrapText(paragraph, timesRoman, BODY_FONT_SIZE, COLUMN_WIDTH - useIndent)

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        checkColumnSpace(BODY_LINE_HEIGHT)

        // Only indent the first line of each paragraph
        const lineIndent = lineIndex === 0 ? useIndent : 0

        currentPage.drawText(lines[lineIndex], {
          x: getColumnX(currentColumn) + lineIndent,
          y: yPosition,
          size: BODY_FONT_SIZE,
          font: timesRoman,
          color: rgb(0, 0, 0),
        })

        yPosition -= BODY_LINE_HEIGHT
      }

      // Space after paragraph
      yPosition -= PARAGRAPH_SPACING
    }

    sectionNumber++
  }

  // ============================================================
  // REFERENCES SECTION (Two Columns)
  // ============================================================

  checkColumnSpace(SPACE_BEFORE_SECTION + HEADING_FONT_SIZE + SPACE_AFTER_HEADING + 30)
  yPosition -= SPACE_BEFORE_SECTION

  // References heading
  currentPage.drawText("REFERENCES", {
    x: getColumnX(currentColumn),
    y: yPosition,
    size: HEADING_FONT_SIZE,
    font: timesBold,
    color: rgb(0, 0, 0),
  })

  yPosition -= BODY_LINE_HEIGHT + SPACE_AFTER_HEADING

  // References list
  for (let i = 0; i < content.references.length; i++) {
    const ref = content.references[i]
    if (!ref.trim()) continue

    // Format reference with number
    const refNumber = `[${i + 1}]`
    const refNumberWidth = timesRoman.widthOfTextAtSize(refNumber, REFERENCE_FONT_SIZE)
    const refTextMaxWidth = COLUMN_WIDTH - refNumberWidth - 6

    // Draw reference number
    checkColumnSpace(REFERENCE_LINE_HEIGHT * 2)

    currentPage.drawText(refNumber, {
      x: getColumnX(currentColumn),
      y: yPosition,
      size: REFERENCE_FONT_SIZE,
      font: timesRoman,
      color: rgb(0, 0, 0),
    })

    // Draw reference text
    const refLines = wrapText(ref, timesRoman, REFERENCE_FONT_SIZE, refTextMaxWidth)
    
    for (let lineIndex = 0; lineIndex < refLines.length; lineIndex++) {
      if (lineIndex > 0) {
        checkColumnSpace(REFERENCE_LINE_HEIGHT)
      }

      currentPage.drawText(refLines[lineIndex], {
        x: getColumnX(currentColumn) + refNumberWidth + 6,
        y: yPosition,
        size: REFERENCE_FONT_SIZE,
        font: timesRoman,
        color: rgb(0, 0, 0),
      })

      yPosition -= REFERENCE_LINE_HEIGHT
    }

    // Space after reference
    yPosition -= 4
  }

  // Save and return PDF bytes
  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

// Convert number to Roman numeral
function toRoman(num: number): string {
  const romanNumerals: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ]

  let result = ""
  for (const [value, symbol] of romanNumerals) {
    while (num >= value) {
      result += symbol
      num -= value
    }
  }
  return result
}
