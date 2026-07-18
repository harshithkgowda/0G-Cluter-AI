import PizZip from "pizzip"

export interface SlideContent {
  slideNumber: number
  title: string
  content: string[]
  imageQuery: string
}

export interface ImageData {
  slideNumber: number
  imageUrl: string | null
  imageBuffer: Buffer | null
}

// EMU conversions (914400 EMUs = 1 inch)
// Standard PowerPoint slide dimensions (16:9 widescreen) - used as defaults
const SLIDE_WIDTH = 12192000 // 13.33 inches in EMUs (widescreen)
const SLIDE_HEIGHT = 6858000 // 7.5 inches in EMUs

// Typography settings - these remain constant
const TITLE_FONT_SIZE = 2600 // 26pt - slightly smaller for better fit
const CONTENT_FONT_SIZE = 1350 // 13.5pt - slightly smaller for better fit
const LINE_SPACING = 140 // 140% line spacing
const BULLET_MARGIN = 285750 // 0.3125 inches

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

interface LayoutDimensions {
  safeMargin: number
  titleTop: number
  titleHeight: number
  titleWidth: number
  contentLeft: number
  contentTop: number
  contentWidth: number
  contentHeight: number
  imageLeft: number
  imageTop: number
  imageWidth: number
  imageHeight: number
}

function createTitleShape(title: string, shapeId: number, layout: LayoutDimensions): string {
  // Truncate title if too long to prevent overflow
  const maxTitleLength = 55
  const displayTitle = title.length > maxTitleLength 
    ? title.substring(0, maxTitleLength - 3) + "..."
    : title

  return `
    <p:sp>
      <p:nvSpPr>
        <p:cNvPr id="${shapeId}" name="AI Title ${shapeId}"/>
        <p:cNvSpPr txBox="1"/>
        <p:nvPr/>
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm>
          <a:off x="${layout.safeMargin}" y="${layout.titleTop}"/>
          <a:ext cx="${layout.titleWidth}" cy="${layout.titleHeight}"/>
        </a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        <a:noFill/>
      </p:spPr>
      <p:txBody>
        <a:bodyPr wrap="square" anchor="ctr" lIns="91440" tIns="45720" rIns="91440" bIns="45720">
          <a:noAutofit/>
        </a:bodyPr>
        <a:lstStyle/>
        <a:p>
          <a:pPr algn="l"/>
          <a:r>
            <a:rPr lang="en-US" sz="${TITLE_FONT_SIZE}" b="1" dirty="0">
              <a:solidFill><a:srgbClr val="1a1a2e"/></a:solidFill>
              <a:latin typeface="Calibri" panose="020F0502020204030204"/>
            </a:rPr>
            <a:t>${escapeXml(displayTitle)}</a:t>
          </a:r>
        </a:p>
      </p:txBody>
    </p:sp>`
}

function createContentShape(bullets: string[], shapeId: number, layout: LayoutDimensions): string {
  // Limit bullets to prevent overflow and truncate long text
  const maxBullets = 5
  const maxBulletLength = 100
  
  const limitedBullets = bullets.slice(0, maxBullets).map(bullet => {
    if (bullet.length > maxBulletLength) {
      return bullet.substring(0, maxBulletLength - 3) + "..."
    }
    return bullet
  })

  const bulletParagraphs = limitedBullets.map((bullet) => {
    return `
        <a:p>
          <a:pPr marL="${BULLET_MARGIN}" indent="-${BULLET_MARGIN}">
            <a:buFont typeface="Wingdings" panose="05000000000000000000" pitchFamily="2" charset="2"/>
            <a:buChar char="§"/>
            <a:spcBef><a:spcPts val="300"/></a:spcBef>
            <a:spcAft><a:spcPts val="150"/></a:spcAft>
            <a:lnSpc><a:spcPct val="${LINE_SPACING}00"/></a:lnSpc>
          </a:pPr>
          <a:r>
            <a:rPr lang="en-US" sz="${CONTENT_FONT_SIZE}" dirty="0">
              <a:solidFill><a:srgbClr val="404040"/></a:solidFill>
              <a:latin typeface="Calibri" panose="020F0502020204030204"/>
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
          <a:off x="${layout.contentLeft}" y="${layout.contentTop}"/>
          <a:ext cx="${layout.contentWidth}" cy="${layout.contentHeight}"/>
        </a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        <a:noFill/>
      </p:spPr>
      <p:txBody>
        <a:bodyPr wrap="square" anchor="t" lIns="91440" tIns="45720" rIns="91440" bIns="45720">
          <a:noAutofit/>
        </a:bodyPr>
        <a:lstStyle/>
        ${bulletParagraphs}
      </p:txBody>
    </p:sp>`
}

function createImageShape(relId: string, shapeId: number, layout: LayoutDimensions): string {
  return `
    <p:pic>
      <p:nvPicPr>
        <p:cNvPr id="${shapeId}" name="AI Image ${shapeId}"/>
        <p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>
        <p:nvPr/>
      </p:nvPicPr>
      <p:blipFill rotWithShape="1">
        <a:blip r:embed="${relId}">
          <a:extLst>
            <a:ext uri="{28A0092B-C50C-407E-A947-70E740481C1C}">
              <a14:useLocalDpi xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" val="0"/>
            </a:ext>
          </a:extLst>
        </a:blip>
        <a:srcRect/>
        <a:stretch><a:fillRect/></a:stretch>
      </p:blipFill>
      <p:spPr>
        <a:xfrm>
          <a:off x="${layout.imageLeft}" y="${layout.imageTop}"/>
          <a:ext cx="${layout.imageWidth}" cy="${layout.imageHeight}"/>
        </a:xfrm>
        <a:prstGeom prst="roundRect">
          <a:avLst>
            <a:gd name="adj" fmla="val 4000"/>
          </a:avLst>
        </a:prstGeom>
        <a:ln w="9525">
          <a:solidFill><a:srgbClr val="D0D0D0"/></a:solidFill>
        </a:ln>
      </p:spPr>
    </p:pic>`
}

/**
 * Extract slide dimensions from presentation.xml
 */
function getSlideDimensions(zip: PizZip): { width: number; height: number } {
  const presentationXml = zip.file("ppt/presentation.xml")?.asText()
  if (presentationXml) {
    // Look for sldSz (slide size) element
    const sldSzMatch = presentationXml.match(/<p:sldSz[^>]*cx="(\d+)"[^>]*cy="(\d+)"/)
    if (sldSzMatch) {
      return {
        width: parseInt(sldSzMatch[1], 10),
        height: parseInt(sldSzMatch[2], 10)
      }
    }
    // Also try reversed attribute order
    const sldSzMatchAlt = presentationXml.match(/<p:sldSz[^>]*cy="(\d+)"[^>]*cx="(\d+)"/)
    if (sldSzMatchAlt) {
      return {
        width: parseInt(sldSzMatchAlt[2], 10),
        height: parseInt(sldSzMatchAlt[1], 10)
      }
    }
  }
  // Default to standard 16:9 widescreen
  return { width: SLIDE_WIDTH, height: SLIDE_HEIGHT }
}

/**
 * Calculate layout dimensions based on actual slide size
 */
function getLayoutDimensions(slideWidth: number, slideHeight: number, hasImage: boolean) {
  const safeMargin = Math.floor(slideWidth * 0.04)
  const titleTop = Math.floor(slideHeight * 0.08)
  const titleHeight = Math.floor(slideHeight * 0.12)
  const contentTop = titleTop + titleHeight + Math.floor(slideHeight * 0.02)
  const contentHeight = Math.floor(slideHeight * 0.68)
  
  // Content width depends on whether we have an image
  const contentWidthWithImage = Math.floor(slideWidth * 0.52)
  const contentWidthNoImage = Math.floor(slideWidth * 0.92)
  const contentWidth = hasImage ? contentWidthWithImage : contentWidthNoImage
  
  // Image area (right side)
  const imageLeft = Math.floor(slideWidth * 0.58)
  const imageWidth = Math.floor(slideWidth * 0.38)
  const imageHeight = Math.floor(slideHeight * 0.60)

  return {
    safeMargin,
    titleTop,
    titleHeight,
    titleWidth: slideWidth - (safeMargin * 2),
    contentLeft: safeMargin,
    contentTop,
    contentWidth,
    contentHeight,
    imageLeft,
    imageTop: contentTop,
    imageWidth,
    imageHeight
  }
}

export function modifyPptx(
  zip: PizZip,
  slides: SlideContent[],
  images: ImageData[],
  targetSlideCount?: number,
  isBlank = false
): PizZip {
  // Get actual slide dimensions from the presentation
  const slideDimensions = getSlideDimensions(zip)
  console.log(`[v0] Detected slide dimensions: ${slideDimensions.width} x ${slideDimensions.height} EMUs`)

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

    // Determine if we have an image for this slide
    const hasImage = !!(imageData?.imageBuffer)

    // Get layout dimensions based on actual slide size
    const layout = getLayoutDimensions(slideDimensions.width, slideDimensions.height, hasImage)

    // Clear existing text and picture shapes but keep background elements
    // Remove content between <p:spTree> and </p:spTree>, keeping the opening nvGrpSpPr and grpSpPr
    const spTreeMatch = slideXml.match(/<p:spTree>([\s\S]*?)<\/p:spTree>/)
    if (spTreeMatch) {
      // Extract the group properties that must be preserved
      const nvGrpSpPrMatch = spTreeMatch[1].match(/<p:nvGrpSpPr>[\s\S]*?<\/p:nvGrpSpPr>/)
      const grpSpPrMatch = spTreeMatch[1].match(/<p:grpSpPr>[\s\S]*?<\/p:grpSpPr>/)

      const nvGrpSpPr = nvGrpSpPrMatch ? nvGrpSpPrMatch[0] : "<p:nvGrpSpPr><p:cNvPr id=\"1\" name=\"\"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>"
      const grpSpPr = grpSpPrMatch ? grpSpPrMatch[0] : "<p:grpSpPr/>"

      // Create new content using the calculated layout
      const titleShape = createTitleShape(slideContent.title, shapeId++, layout)
      const contentShape = createContentShape(slideContent.content, shapeId++, layout)

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

        imageShape = createImageShape(newRId, shapeId++, layout)
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
