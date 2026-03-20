import { NextRequest, NextResponse } from "next/server"
import { generateContentWithAI } from "@/lib/ai-content-generator"

export async function POST(request: NextRequest) {
  try {
    const { pages, prompt } = await request.json()

    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
            const page = pages[pageIndex]

            // Send page generation start event
            controller.enqueue(
              new TextEncoder().encode(
                JSON.stringify({
                  type: "page_start",
                  pageNumber: pageIndex + 1,
                  title: page.title,
                }) + "\n"
              )
            )

            // Generate content for each section
            for (let sectionIndex = 0; sectionIndex < page.sections.length; sectionIndex++) {
              try {
                const section = page.sections[sectionIndex]

                // Send section generation start
                controller.enqueue(
                  new TextEncoder().encode(
                    JSON.stringify({
                      type: "section_start",
                      pageNumber: pageIndex + 1,
                      sectionIndex,
                      sectionType: section.type,
                    }) + "\n"
                  )
                )

                // Generate content
                const response = await generateContentWithAI(
                  `Generate ${section.type} content for: ${prompt}`
                )

                const content = response.slides[0]?.content.join("\n") || ""

                // Stream content in chunks for typing effect
                const chunks = content.match(/.{1,50}/g) || []
                for (const chunk of chunks) {
                  controller.enqueue(
                    new TextEncoder().encode(
                      JSON.stringify({
                        type: "section_content",
                        pageNumber: pageIndex + 1,
                        sectionIndex,
                        chunk,
                      }) + "\n"
                    )
                  )
                  // Small delay between chunks for effect
                  await new Promise((resolve) => setTimeout(resolve, 20))
                }

                // Send section complete event
                controller.enqueue(
                  new TextEncoder().encode(
                    JSON.stringify({
                      type: "section_complete",
                      pageNumber: pageIndex + 1,
                      sectionIndex,
                      content,
                    }) + "\n"
                  )
                )
              } catch (error) {
                controller.enqueue(
                  new TextEncoder().encode(
                    JSON.stringify({
                      type: "section_error",
                      pageNumber: pageIndex + 1,
                      sectionIndex,
                      error: error instanceof Error ? error.message : "Unknown error",
                    }) + "\n"
                  )
                )
              }
            }

            // Send page complete event
            controller.enqueue(
              new TextEncoder().encode(
                JSON.stringify({
                  type: "page_complete",
                  pageNumber: pageIndex + 1,
                }) + "\n"
              )
            )
          }

          // Send completion
          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({
                type: "complete",
              }) + "\n"
            )
          )

          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("[v0] Error in stream generation:", error)
    return NextResponse.json(
      {
        error: "Failed to start generation stream",
      },
      { status: 500 }
    )
  }
}
