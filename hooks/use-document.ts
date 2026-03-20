import { useState, useCallback } from "react"
import { Document, DocumentPage, DocumentSection, GenerationState } from "@/types/document"

export function useDocument() {
  const [document, setDocument] = useState<Document | null>(null)
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    currentPage: 0,
    totalPages: 0,
    progress: 0,
  })

  const updatePage = useCallback((pageIndex: number, updatedPage: DocumentPage) => {
    setDocument((prev) => {
      if (!prev) return null
      const newPages = [...prev.pages]
      newPages[pageIndex] = updatedPage
      return { ...prev, pages: newPages }
    })
  }, [])

  const updateSection = useCallback(
    (pageIndex: number, sectionIndex: number, updatedSection: DocumentSection) => {
      setDocument((prev) => {
        if (!prev) return null
        const newPages = [...prev.pages]
        const page = { ...newPages[pageIndex] }
        const sections = [...page.sections]
        sections[sectionIndex] = updatedSection
        page.sections = sections
        newPages[pageIndex] = page
        return { ...prev, pages: newPages }
      })
    },
    []
  )

  const startGenerating = useCallback((totalPages: number) => {
    setGenerationState({
      isGenerating: true,
      currentPage: 0,
      totalPages,
      progress: 0,
    })
  }, [])

  const updateGenerationProgress = useCallback((currentPage: number, section?: string) => {
    setGenerationState((prev) => ({
      ...prev,
      currentPage,
      currentSection: section,
      progress: (currentPage / prev.totalPages) * 100,
    }))
  }, [])

  const finishGenerating = useCallback(() => {
    setGenerationState({
      isGenerating: false,
      currentPage: 0,
      totalPages: 0,
      progress: 100,
    })
  }, [])

  const setCurrentPage = useCallback((pageIndex: number) => {
    setDocument((prev) => (prev ? { ...prev, currentPageIndex: pageIndex } : null))
  }, [])

  return {
    document,
    setDocument,
    generationState,
    startGenerating,
    updateGenerationProgress,
    finishGenerating,
    updatePage,
    updateSection,
    setCurrentPage,
  }
}
