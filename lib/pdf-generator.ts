// PDF Generator - Creates IEEE-style conference papers
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib"

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

const PAGE_WIDTH = 612 // Letter size
const PAGE_HEIGHT = 792
const MARGIN_LEFT = 54 // 0.75 inch
const MARGIN_RIGHT = 54
const MARGIN_TOP = 72 // 1 inch
const MARGIN_BOTTOM = 72
const COLUMN_WIDTH = (PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT - 18) / 2 // Two columns with gap
const COLUMN_GAP = 18
const LINE_HEIGHT = 12
const PARAGRAPH_SPACING = 6

// Header area constraints to prevent overlap
const TITLE_MAX_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT - 40 // Extra padding for safety
const HEADER_LINE_HEIGHT = 18
const AUTHOR_LINE_HEIGHT = 16
const AFFILIATION_LINE_HEIGHT = 14

export async function generateIEEEPaper(content: PaperContent): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()

  // Embed fonts
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
  const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)

  let currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let yPosition = PAGE_HEIGHT - MARGIN_TOP
  let currentColumn = 0 // 0 = left, 1 = right

  const getColumnX = (col: number) => (col === 0 ? MARGIN_LEFT : MARGIN_LEFT + COLUMN_WIDTH + COLUMN_GAP)

  // Helper function to add a new page
  const addNewPage = () => {
    currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    yPosition = PAGE_HEIGHT - MARGIN_TOP
    currentColumn = 0
    return currentPage
  }

  // Helper function to switch columns or add new page
  const checkSpace = (neededHeight: number) => {
    if (yPosition - neededHeight < MARGIN_BOTTOM) {
      if (currentColumn === 0) {
        currentColumn = 1
        yPosition = PAGE_HEIGHT - MARGIN_TOP
      } else {
        addNewPage()
      }
    }
  }

  // Improved text wrapping with word boundary respect
  const wrapText = (text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] => {
    const words = text.split(/\s+/).filter(w => w.length > 0)
    const lines: string[] = []
    let currentLine = ""

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const testWidth = font.widthOfTextAtSize(testLine, fontSize)

      if (testWidth <= maxWidth) {
        currentLine = testLine
      } else {
        if (currentLine) {
          lines.push(currentLine)
        }
        // Handle very long words that exceed maxWidth
        if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
          // Break the word into smaller chunks
          let remaining = word
          while (remaining.length > 0) {
            let chunkEnd = remaining.length
            while (chunkEnd > 1 && font.widthOfTextAtSize(remaining.substring(0, chunkEnd), fontSize) > maxWidth) {
              chunkEnd--
            }
            if (lines.length > 0 || currentLine) {
              lines.push(remaining.substring(0, chunkEnd))
            } else {
              lines.push(remaining.substring(0, chunkEnd))
            }
            remaining = remaining.substring(chunkEnd)
          }
          currentLine = ""
        } else {
          currentLine = word
        }
      }
    }
    if (currentLine) lines.push(currentLine)

    return lines
  }

  // Safe text drawing that ensures no overlap by calculating exact height needed
  const drawCenteredText = (
    text: string,
    font: PDFFont,
    fontSize: number,
    lineHeight: number,
    maxWidth: number
  ): number => {
    const lines = wrapText(text, font, fontSize, maxWidth)
    let totalHeight = 0

    for (const line of lines) {
      const textWidth = font.widthOfTextAtSize(line, fontSize)
      const xPosition = (PAGE_WIDTH - textWidth) / 2

      currentPage.drawText(line, {
        x: Math.max(MARGIN_LEFT, xPosition), // Ensure we don't go past left margin
        y: yPosition,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      })

      yPosition -= lineHeight
      totalHeight += lineHeight
    }

    return totalHeight
  }

  // ========== TITLE SECTION ==========
  // Draw title with proper wrapping and centering
  const titleText = content.title.toUpperCase()
  drawCenteredText(titleText, timesBold, 14, HEADER_LINE_HEIGHT, TITLE_MAX_WIDTH)
  
  // Add spacing after title
  yPosition -= 12

  // ========== AUTHORS SECTION ==========
  if (content.authors && content.authors.trim()) {
    // Split authors by comma and handle each
    const authorText = content.authors.trim()
    drawCenteredText(authorText, timesRoman, 11, AUTHOR_LINE_HEIGHT, TITLE_MAX_WIDTH)
    yPosition -= 4
  }

  // ========== AFFILIATIONS SECTION ==========
  if (content.affiliations && content.affiliations.trim()) {
    const affiliationText = content.affiliations.trim()
    drawCenteredText(affiliationText, timesItalic, 10, AFFILIATION_LINE_HEIGHT, TITLE_MAX_WIDTH)
  }

  // Add spacing before abstract
  yPosition -= 24

  // ========== ABSTRACT SECTION ==========
  // Draw Abstract heading
  currentPage.drawText("Abstract:", {
    x: MARGIN_LEFT,
    y: yPosition,
    size: 9,
    font: timesBold,
    color: rgb(0, 0, 0),
  })

  yPosition -= 12

  // Draw abstract content
  const abstractLines = wrapText(content.abstract, timesItalic, 9, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT)
  for (const line of abstractLines) {
    // Check if we need a new page (shouldn't happen in abstract, but safety check)
    if (yPosition < MARGIN_BOTTOM) {
      addNewPage()
    }
    
    currentPage.drawText(line, {
      x: MARGIN_LEFT,
      y: yPosition,
      size: 9,
      font: timesItalic,
      color: rgb(0, 0, 0),
    })
    yPosition -= 11
  }

  yPosition -= 8

  // ========== KEYWORDS SECTION ==========
  if (content.keywords && content.keywords.length > 0) {
    const keywordsText = `Keywords: ${content.keywords.join(", ")}`
    const keywordLines = wrapText(keywordsText, timesItalic, 9, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT)
    
    for (const line of keywordLines) {
      if (yPosition < MARGIN_BOTTOM) {
        addNewPage()
      }
      
      currentPage.drawText(line, {
        x: MARGIN_LEFT,
        y: yPosition,
        size: 9,
        font: timesItalic,
        color: rgb(0, 0, 0),
      })
      yPosition -= 11
    }
  }

  // Add spacing before two-column content
  yPosition -= 24

  // ========== MAIN CONTENT (TWO-COLUMN) ==========
  let sectionNumber = 1

  for (const section of content.sections) {
    // Check space for section heading (need at least heading + 2 lines of content)
    checkSpace(50)

    // Draw section heading
    const sectionHeading = `${toRoman(sectionNumber)}. ${section.heading.toUpperCase()}`
    const headingX = getColumnX(currentColumn)

    currentPage.drawText(sectionHeading, {
      x: headingX,
      y: yPosition,
      size: 10,
      font: timesBold,
      color: rgb(0, 0, 0),
    })

    yPosition -= LINE_HEIGHT + 6

    // Draw section content
    const paragraphs = section.content.split(/\n+/).filter(p => p.trim())

    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) continue

      const lines = wrapText(paragraph.trim(), timesRoman, 9, COLUMN_WIDTH)

      for (let i = 0; i < lines.length; i++) {
        checkSpace(LINE_HEIGHT)

        const lineX = getColumnX(currentColumn)
        // Add indent for first line of paragraph only
        const indent = i === 0 ? 18 : 0

        currentPage.drawText(lines[i], {
          x: lineX + indent,
          y: yPosition,
          size: 9,
          font: timesRoman,
          color: rgb(0, 0, 0),
        })

        yPosition -= LINE_HEIGHT
      }

      yPosition -= PARAGRAPH_SPACING
    }

    yPosition -= 10
    sectionNumber++
  }

  // ========== REFERENCES SECTION ==========
  checkSpace(40)

  currentPage.drawText("REFERENCES", {
    x: getColumnX(currentColumn),
    y: yPosition,
    size: 10,
    font: timesBold,
    color: rgb(0, 0, 0),
  })

  yPosition -= LINE_HEIGHT + 6

  for (const ref of content.references) {
    checkSpace(LINE_HEIGHT * 4) // References can be multi-line

    const refLines = wrapText(ref, timesRoman, 8, COLUMN_WIDTH)
    for (const line of refLines) {
      currentPage.drawText(line, {
        x: getColumnX(currentColumn),
        y: yPosition,
        size: 8,
        font: timesRoman,
        color: rgb(0, 0, 0),
      })
      yPosition -= 10
    }
    yPosition -= 4
  }

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
