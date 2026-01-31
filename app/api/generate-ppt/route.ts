import { type NextRequest, NextResponse } from "next/server"
import PizZip from "pizzip"
import { generateContentWithAI } from "@/lib/ai-content-generator"
import { fetchImagesForSlides, downloadImage } from "@/lib/image-fetcher"
import { modifyPptx, generatePptxBuffer } from "@/lib/pptx-processor"
import type { ImageData } from "@/lib/pptx-processor"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const prompt = formData.get("prompt") as string
    const slideCountStr = formData.get("slideCount") as string
    const slideCount = slideCountStr ? Number.parseInt(slideCountStr, 10) : undefined
    const isBlank = formData.get("isBlank") === "true"

    if (!file || !prompt) {
      return NextResponse.json({ error: "Missing file or prompt" }, { status: 400 })
    }

    console.log("[v0] Processing PPT generation request")
    console.log("[v0] File:", file.name, "Size:", (file.size / 1024).toFixed(2), "KB")
    console.log("[v0] Is blank template:", isBlank)
    if (slideCount) {
      console.log("[v0] Requested slide count:", slideCount)
    }

    // Step 1: Read the uploaded PPTX file
    const arrayBuffer = await file.arrayBuffer()
    const zip = new PizZip(arrayBuffer)

    // Step 2: Generate content with AI
    console.log("[v0] Generating content with Gemini 2.0 Flash...")
    const generatedContent = await generateContentWithAI(prompt, slideCount)

    console.log("[v0] Generated content for", generatedContent.slides.length, "slides")

    // Step 3: Search for images for each slide
    console.log("[v0] Searching for relevant images on Pixabay...")
    const imageResults = await fetchImagesForSlides(generatedContent.slides)

    const imagesFound = imageResults.filter((r) => r.imageUrl).length
    console.log(`[v0] Found ${imagesFound}/${imageResults.length} images`)

    // Step 4: Download images
    console.log("[v0] Downloading images...")
    const imageDataPromises = imageResults.map(async (result) => {
      if (result.imageUrl) {
        const buffer = await downloadImage(result.imageUrl)
        return {
          slideNumber: result.slideNumber,
          imageUrl: result.imageUrl,
          imageBuffer: buffer,
        }
      }
      return {
        slideNumber: result.slideNumber,
        imageUrl: null,
        imageBuffer: null,
      }
    })

    const imageData: ImageData[] = await Promise.all(imageDataPromises)
    const imagesDownloaded = imageData.filter((d) => d.imageBuffer).length
    console.log(`[v0] Downloaded ${imagesDownloaded} images successfully`)

    // Step 5: Modify the PPTX content
    console.log("[v0] Modifying presentation content...")
    const modifiedZip = modifyPptx(zip, generatedContent.slides, imageData, slideCount, isBlank)

    // Step 6: Generate the modified PPTX
    console.log("[v0] Generating final PPTX file...")
    const modifiedPptx = generatePptxBuffer(modifiedZip)

    console.log("[v0] Successfully generated presentation")

    // Return the modified PPTX file
    return new NextResponse(modifiedPptx, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="ai-generated-${file.name}"`,
      },
    })
  } catch (error) {
    console.error("[v0] Error generating PPT:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate presentation",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
