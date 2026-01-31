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

  // Helper function to wrap text
  const wrapText = (text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] => {
    const words = text.split(/\s+/)
    const lines: string[] = []
    let currentLine = ""

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const testWidth = font.widthOfTextAtSize(testLine, fontSize)

      if (testWidth <= maxWidth) {
        currentLine = testLine
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
      }
    }
    if (currentLine) lines.push(currentLine)

    return lines
  }

  // Draw title (centered, full width, larger font)
  const titleLines = wrapText(content.title.toUpperCase(), timesBold, 14, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT)
  for (const line of titleLines) {
    const titleWidth = timesBold.widthOfTextAtSize(line, 14)
    currentPage.drawText(line, {
      x: (PAGE_WIDTH - titleWidth) / 2,
      y: yPosition,
      size: 14,
      font: timesBold,
      color: rgb(0, 0, 0),
    })
    yPosition -= 18
  }
  yPosition -= 10

  // Draw authors (centered)
  if (content.authors) {
    const authorLines = wrapText(content.authors, timesRoman, 11, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT)
    for (const line of authorLines) {
      const authorWidth = timesRoman.widthOfTextAtSize(line, 11)
      currentPage.drawText(line, {
        x: (PAGE_WIDTH - authorWidth) / 2,
        y: yPosition,
        size: 11,
        font: timesRoman,
        color: rgb(0, 0, 0),
      })
      yPosition -= 14
    }
  }

  // Draw affiliations (centered, italic)
  if (content.affiliations) {
    const affLines = wrapText(content.affiliations, timesItalic, 10, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT)
    for (const line of affLines) {
      const affWidth = timesItalic.widthOfTextAtSize(line, 10)
      currentPage.drawText(line, {
        x: (PAGE_WIDTH - affWidth) / 2,
        y: yPosition,
        size: 10,
        font: timesItalic,
        color: rgb(0, 0, 0),
      })
      yPosition -= 13
    }
  }

  yPosition -= 20

  // Draw Abstract (full width, italic label)
  currentPage.drawText("Abstract:", {
    x: MARGIN_LEFT,
    y: yPosition,
    size: 9,
    font: timesBold,
    color: rgb(0, 0, 0),
  })

  const abstractText = content.abstract
  const abstractLines = wrapText(abstractText, timesItalic, 9, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT)

  yPosition -= 12
  for (const line of abstractLines) {
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

  // Draw Keywords
  if (content.keywords && content.keywords.length > 0) {
    const keywordsText = `Keywords: ${content.keywords.join(", ")}`
    const keywordLines = wrapText(keywordsText, timesItalic, 9, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT)
    for (const line of keywordLines) {
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

  yPosition -= 20

  // Start two-column layout for sections
  let sectionNumber = 1

  for (const section of content.sections) {
    // Draw section heading
    checkSpace(30)

    const sectionHeading = `${toRoman(sectionNumber)}. ${section.heading.toUpperCase()}`
    const headingX = getColumnX(currentColumn)

    currentPage.drawText(sectionHeading, {
      x: headingX,
      y: yPosition,
      size: 10,
      font: timesBold,
      color: rgb(0, 0, 0),
    })

    yPosition -= LINE_HEIGHT + 4

    // Draw section content
    const paragraphs = section.content.split(/\n+/)

    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) continue

      const lines = wrapText(paragraph.trim(), timesRoman, 9, COLUMN_WIDTH)

      for (let i = 0; i < lines.length; i++) {
        checkSpace(LINE_HEIGHT)

        const lineX = getColumnX(currentColumn)
        // Add indent for first line of paragraph
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

    yPosition -= 8
    sectionNumber++
  }

  // Draw References section
  checkSpace(30)

  currentPage.drawText("REFERENCES", {
    x: getColumnX(currentColumn),
    y: yPosition,
    size: 10,
    font: timesBold,
    color: rgb(0, 0, 0),
  })

  yPosition -= LINE_HEIGHT + 4

  for (const ref of content.references) {
    checkSpace(LINE_HEIGHT * 3)

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
