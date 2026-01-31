export interface PixabayImage {
  id: number
  pageURL: string
  largeImageURL: string
  webformatURL: string
  imageWidth: number
  imageHeight: number
}

export interface PixabayResponse {
  total: number
  totalHits: number
  hits: PixabayImage[]
}

/**
 * Search for images on Pixabay
 */
export async function searchPixabayImage(query: string): Promise<string | null> {
  const apiKey = process.env.PIXABAY_API_KEY

  if (!apiKey) {
    console.warn("[v0] PIXABAY_API_KEY not configured, skipping image search")
    return null
  }

  try {
    let searchQuery = query.trim()

    // Simplify the query - take only first 2-3 words
    const words = searchQuery.split(/\s+/).slice(0, 3)
    searchQuery = words.join(" ")

    // Remove special characters that might cause issues
    searchQuery = searchQuery
      .replace(/[(),:;'"!?]/g, "")
      .replace(/\s+/g, " ")
      .trim()

    // Ensure query is under 100 characters
    if (searchQuery.length > 80) {
      searchQuery = searchQuery.substring(0, 80).trim()
      const lastSpace = searchQuery.lastIndexOf(" ")
      if (lastSpace > 40) {
        searchQuery = searchQuery.substring(0, lastSpace)
      }
    }

    // Fallback to generic business image if query is too short
    if (searchQuery.length < 3) {
      searchQuery = "business professional"
    }

    console.log(`[v0] Image search: "${searchQuery}" (original: "${query.substring(0, 50)}...")`)

    const url = new URL("https://pixabay.com/api/")
    url.searchParams.set("key", apiKey)
    url.searchParams.set("q", searchQuery)
    url.searchParams.set("image_type", "photo")
    url.searchParams.set("per_page", "3")
    url.searchParams.set("safesearch", "true")
    url.searchParams.set("orientation", "horizontal")

    const response = await fetch(url.toString())

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Pixabay API error:", response.status, errorText)
      return null
    }

    const data: PixabayResponse = await response.json()

    if (data.hits && data.hits.length > 0) {
      console.log(`[v0] Found image for query: ${searchQuery}`)
      return data.hits[0].largeImageURL
    }

    console.log(`[v0] No images found for query: ${searchQuery}`)
    return null
  } catch (error) {
    console.error("[v0] Error fetching from Pixabay:", error)
    return null
  }
}

/**
 * Download image as buffer
 */
export async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`[v0] Failed to download image: ${response.status}`)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error("[v0] Error downloading image:", error)
    return null
  }
}

/**
 * Fetch images for multiple queries in parallel
 */
export async function fetchImagesForSlides(
  slides: Array<{ slideNumber: number; imageQuery?: string }>,
): Promise<Array<{ slideNumber: number; imageUrl: string | null }>> {
  const imagePromises = slides.map(async (slide) => {
    if (slide.imageQuery) {
      const imageUrl = await searchPixabayImage(slide.imageQuery)
      return { slideNumber: slide.slideNumber, imageUrl }
    }
    return { slideNumber: slide.slideNumber, imageUrl: null }
  })

  return Promise.all(imagePromises)
}
