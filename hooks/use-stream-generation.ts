import { useState, useCallback } from "react"
import { Document, DocumentPage } from "@/types/document"

export interface StreamEvent {
  type:
    | "page_start"
    | "section_start"
    | "section_content"
    | "section_complete"
    | "section_error"
    | "page_complete"
    | "complete"
  pageNumber?: number
  sectionIndex?: number
  chunk?: string
  content?: string
  error?: string
}

export function useStreamGeneration() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const streamGenerate = useCallback(
    async (pages: DocumentPage[], prompt: string, onEvent: (event: StreamEvent) => void) => {
      setIsStreaming(true)
      setError(null)

      try {
        const response = await fetch("/api/generate-stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pages, prompt }),
        })

        if (!response.ok) {
          throw new Error("Failed to start stream")
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error("No response body")

        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // Process complete lines
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (line.trim()) {
              try {
                const event = JSON.parse(line) as StreamEvent
                onEvent(event)

                if (event.type === "complete") {
                  setIsStreaming(false)
                  return
                }
              } catch (e) {
                console.error("[v0] Failed to parse event:", e)
              }
            }
          }
        }

        setIsStreaming(false)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error"
        setError(errorMsg)
        setIsStreaming(false)
        throw err
      }
    },
    []
  )

  return {
    isStreaming,
    error,
    streamGenerate,
    clearError: () => setError(null),
  }
}
