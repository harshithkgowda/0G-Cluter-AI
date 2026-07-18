import PizZip from "pizzip"

export interface SlideContent {
  slideNumber: number
  title: string
  content: string[]
  imageQuery?: string
}

export interface ImageData {
  slideNumber: number
  imageUrl: string | null
  imageBuffer: Buffer | null
}

// EMU conversions (914400 EMUs = 1 inch)
const EMU_PER_INCH = 914400
const SLIDE_WIDTH = 9144000 // 10 inches in EMUs
const SLIDE_HEIGHT = 6858000 // 7.5 inches in EMUs

// Safe content areas (avoid template decorations)
const CONTENT_MARGIN_LEFT = Math.floor(SLIDE_WIDTH * 0.05)
const CONTENT_MARGIN_TOP = Math.floor(SLIDE_HEIGHT * 0.15)
const CONTENT_WIDTH = Math.floor(SLIDE_WIDTH * 0.55)
const TITLE_HEIGHT = Math.floor(SLIDE_HEIGHT * 0.12)
const CONTENT_HEIGHT = Math.floor(SLIDE_HEIGHT * 0.65)

// Image positioning
const IMAGE_LEFT = Math.floor(SLIDE_WIDTH * 0.62)
const IMAGE_TOP = Math.floor(SLIDE_HEIGHT * 0.18)
const IMAGE_WIDTH = Math.floor(SLIDE_WIDTH * 0.33)
const IMAGE_HEIGHT = Math.floor(SLIDE_HEIGHT * 0.55)

// Line height for bullet points
const LINE_HEIGHT = Math.floor(SLIDE_HEIGHT * 0.08)

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function createTitleShape(title: string, shapeId: number): string {
  return `
    <p:sp>
      <p:nvSpPr>
        <p:cNvPr id="${shapeId}" name="AI Title ${shapeId}"/>
        <p:cNvSpPr txBox="1"/>
        <p:nvPr/>
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm>
          <a:off x="${CONTENT_MARGIN_LEFT}" y="${CONTENT_MARGIN_TOP}"/>
          <a:ext cx="${CONTENT_WIDTH + IMAGE_WIDTH}" cy="${TITLE_HEIGHT}"/>
        </a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        <a:noFill/>
      </p:spPr>
      <p:txBody>
        <a:bodyPr wrap="square" anchor="t"/>
        <a:lstStyle/>
        <a:p>
          <a:pPr algn="l"/>
          <a:r>
            <a:rPr lang="en-US" sz="3200" b="1" dirty="0">
              <a:solidFill><a:srgbClr val="1a1a2e"/></a:solidFill>
              <a:latin typeface="Arial" panose="020B0604020202020204"/>
            </a:rPr>
            <a:t>${escapeXml(title)}</a:t>
          </a:r>
        </a:p>
      </p:txBody>
    </p:sp>`
}

function createContentShape(bullets: string[], shapeId: number): string {
  const bulletParagraphs = bullets.map((bullet, idx) => {
    const yOffset = idx * LINE_HEIGHT
    return `
        <a:p>
          <a:pPr marL="342900" indent="-342900">
            <a:buFont typeface="Arial" panose="020B0604020202020204"/>
            <a:buChar char="•"/>
            <a:spcBef><a:spcPts val="600"/></a:spcBef>
            <a:spcAft><a:spcPts val="300"/></a:spcAft>
          </a:pPr>
          <a:r>
            <a:rPr lang="en-US" sz="1600" dirty="0">
              <a:solidFill><a:srgbClr val="333333"/></a:solidFill>
              <a:latin typeface="Arial" panose="020B0604020202020204"/>
            </a:rPr>
            <a:t>${escapeXml(bullet)}</a:t>
          </a:r>
        </a:p>`
  }).join("")

  return `
    <p:sp>
      <p:nvSpPr>
        <p:cNvPr id="${shapeId}" name="AI Content ${shapeId}"/>
        <p:cNvSpPr txBox="1"/>
        <p:nvPr/>
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm>
          <a:off x="${CONTENT_MARGIN_LEFT}" y="${CONTENT_MARGIN_TOP + TITLE_HEIGHT + 100000}"/>
          <a:ext cx="${CONTENT_WIDTH}" cy="${CONTENT_HEIGHT}"/>
        </a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        <a:noFill/>
      </p:spPr>
      <p:txBody>
        <a:bodyPr wrap="square" anchor="t" lIns="91440" tIns="45720" rIns="91440" bIns="45720"/>
        <a:lstStyle/>
        ${bulletParagraphs}
      </p:txBody>
    </p:sp>`
}

function createImageShape(relId: string, shapeId: number): string {
  return `
    <p:pic>
      <p:nvPicPr>
        <p:cNvPr id="${shapeId}" name="AI Image ${shapeId}"/>
        <p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>
        <p:nvPr/>
      </p:nvPicPr>
      <p:blipFill>
        <a:blip r:embed="${relId}"/>
        <a:stretch><a:fillRect/></a:stretch>
      </p:blipFill>
      <p:spPr>
        <a:xfrm>
          <a:off x="${IMAGE_LEFT}" y="${IMAGE_TOP}"/>
          <a:ext cx="${IMAGE_WIDTH}" cy="${IMAGE_HEIGHT}"/>
        </a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
      </p:spPr>
    </p:pic>`
}

export function modifyPptx(
  zip: PizZip,
  slides: SlideContent[],
  images: ImageData[],
  targetSlideCount?: number,
  isBlank = false
): PizZip {
  // Get list of slide files
  const slideFiles = Object.keys(zip.files)
    .filter(name => name.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || "0")
      const numB = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || "0")
      return numA - numB
    })

  const totalSlides = slideFiles.length
  const slidesToProcess = targetSlideCount ? Math.min(targetSlideCount, totalSlides, slides.length) : Math.min(totalSlides, slides.length)

  // Process each slide
  for (let i = 0; i < slidesToProcess; i++) {
    const slideFile = slideFiles[i]
    const slideContent = slides[i]
    const imageData = images.find(img => img.slideNumber === slideContent.slideNumber)

    if (!slideFile || !slideContent) continue

    let slideXml = zip.file(slideFile)?.asText()
    if (!slideXml) continue

    // Generate unique shape IDs (high numbers to avoid conflicts)
    const baseId = 10000 + (i * 100)
    let shapeId = baseId

    // Clear existing text and picture shapes but keep background elements
    // Remove content between <p:spTree> and </p:spTree>, keeping the opening nvGrpSpPr and grpSpPr
    const spTreeMatch = slideXml.match(/<p:spTree>([\s\S]*?)<\/p:spTree>/)
    if (spTreeMatch) {
      // Extract the group properties that must be preserved
      const nvGrpSpPrMatch = spTreeMatch[1].match(/<p:nvGrpSpPr>[\s\S]*?<\/p:nvGrpSpPr>/)
      const grpSpPrMatch = spTreeMatch[1].match(/<p:grpSpPr>[\s\S]*?<\/p:grpSpPr>/)

      const nvGrpSpPr = nvGrpSpPrMatch ? nvGrpSpPrMatch[0] : "<p:nvGrpSpPr><p:cNvPr id=\"1\" name=\"\"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>"
      const grpSpPr = grpSpPrMatch ? grpSpPrMatch[0] : "<p:grpSpPr/>"

      // Create new content
      const titleShape = createTitleShape(slideContent.title, shapeId++)
      const contentShape = createContentShape(slideContent.content, shapeId++)

      // Handle image if available
      let imageShape = ""
      if (imageData?.imageBuffer) {
        const imageExtension = "png"
        const imagePath = `ppt/media/ai_image_slide${i + 1}.${imageExtension}`
        
        // Add image to zip
        zip.file(imagePath, imageData.imageBuffer)

        // Add relationship for image
        const relsPath = `ppt/slides/_rels/slide${i + 1}.xml.rels`
        let relsXml = zip.file(relsPath)?.asText() || `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`

        // Find highest rId
        const rIdMatches = relsXml.match(/rId(\d+)/g) || []
        const maxRId = rIdMatches.length > 0 
          ? Math.max(...rIdMatches.map(r => parseInt(r.replace("rId", ""))))
          : 0
        const newRId = `rId${maxRId + 1}`

        // Add image relationship
        const newRel = `<Relationship Id="${newRId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/ai_image_slide${i + 1}.${imageExtension}"/>`
        relsXml = relsXml.replace("</Relationships>", `${newRel}</Relationships>`)
        zip.file(relsPath, relsXml)

        // Update Content_Types if needed
        const contentTypesPath = "[Content_Types].xml"
        let contentTypesXml = zip.file(contentTypesPath)?.asText() || ""
        if (!contentTypesXml.includes('Extension="png"')) {
          contentTypesXml = contentTypesXml.replace(
            "</Types>",
            `<Default Extension="png" ContentType="image/png"/></Types>`
          )
          zip.file(contentTypesPath, contentTypesXml)
        }

        imageShape = createImageShape(newRId, shapeId++)
      }

      // Rebuild spTree with new content
      const newSpTree = `<p:spTree>${nvGrpSpPr}${grpSpPr}${titleShape}${contentShape}${imageShape}</p:spTree>`
      slideXml = slideXml.replace(/<p:spTree>[\s\S]*?<\/p:spTree>/, newSpTree)

      zip.file(slideFile, slideXml)
    }
  }

  // Remove extra slides if targetSlideCount is specified
  if (targetSlideCount && targetSlideCount < totalSlides) {
    for (let i = targetSlideCount; i < totalSlides; i++) {
      const slideNum = i + 1
      zip.remove(`ppt/slides/slide${slideNum}.xml`)
      zip.remove(`ppt/slides/_rels/slide${slideNum}.xml.rels`)
    }

    // Update presentation.xml to remove slide references
    const presentationPath = "ppt/presentation.xml"
    let presentationXml = zip.file(presentationPath)?.asText()
    if (presentationXml) {
      // Remove slide references beyond targetSlideCount
      for (let i = targetSlideCount; i < totalSlides; i++) {
        const slideIdPattern = new RegExp(`<p:sldId[^>]*r:id="rId${i + 2}"[^>]*/>`, "g")
        presentationXml = presentationXml.replace(slideIdPattern, "")
      }
      zip.file(presentationPath, presentationXml)
    }
  }

  return zip
}

export function generatePptxBuffer(zip: PizZip): Buffer {
  return zip.generate({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 }
  }) as Buffer
}
