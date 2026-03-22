"use client"

import { Document, DocumentPage } from "@/types/document"
import { useState, useEffect, useCallback } from "react"
import { PageSidebar } from "./page-sidebar"
import { PagePreview } from "./page-preview"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Sparkles, Download, Loader2 } from "lucide-react"

interface DocumentEditorProps {
  document: Document
  onDocumentChange?: (document: Document) => void
}

export function DocumentEditor({ document: initialDocument, onDocumentChange }: DocumentEditorProps) {
  const [doc, setDoc] = useState<Document>(initialDocument)
  const [isGeneratingAll, setIsGeneratingAll] = useState(false)
  const [generationState, setGenerationState] = useState({
    isGenerating: false,
    currentPage: 0,
    totalPages: initialDocument.pages.length,
    progress: 0,
  })
  const { toast } = useToast()

  useEffect(() => {
    setDoc(initialDocument)
    setGenerationState(prev => ({ ...prev, totalPages: initialDocument.pages.length }))
  }, [initialDocument])

  const updateDoc = useCallback((updated: Document) => {
    setDoc(updated)
    onDocumentChange?.(updated)
  }, [onDocumentChange])

  const handleUpdatePage = (updatedPage: DocumentPage) => {
    const pages = [...doc.pages]
    pages[doc.currentPageIndex] = updatedPage
    updateDoc({ ...doc, pages })
  }

  const handleSelectPage = (index: number) => {
    updateDoc({ ...doc, currentPageIndex: index })
  }

  const handleAddSection = () => {
    const currentPage = doc.pages[doc.currentPageIndex]
    const newSection = {
      id: `section-${Date.now()}`,
      type: "paragraph" as const,
      content: "",
      isEditing: true,
    }
    handleUpdatePage({ ...currentPage, sections: [...currentPage.sections, newSection] })
  }

  const handleDownload = () => {
    toast({ title: "Export coming soon", description: "Download feature is in development" })
  }

  // Generate AI content for all slides sequentially
  const handleGenerateAll = async () => {
    setIsGeneratingAll(true)
    const totalPages = doc.pages.length

    for (let i = 0; i < totalPages; i++) {
      const page = doc.pages[i]

      setGenerationState({ isGenerating: true, currentPage: i, totalPages, progress: Math.round((i / totalPages) * 100) })

      // Navigate to current generating slide
      setDoc(prev => ({ ...prev, currentPageIndex: i }))

      try {
        // Mark all sections as generating (triggers typing via isGenerating flag)
        const generatingSections = page.sections.map(s => ({ ...s, isGenerating: true }))
        setDoc(prev => {
          const pages = [...prev.pages]
          pages[i] = { ...pages[i], sections: generatingSections }
          return { ...prev, pages, currentPageIndex: i }
        })

        // Wait briefly to show the generating state per slide
        await new Promise(r => setTimeout(r, 800))

        // Mark as done
        const doneSections = generatingSections.map(s => ({ ...s, isGenerating: false }))
        setDoc(prev => {
          const pages = [...prev.pages]
          pages[i] = { ...pages[i], sections: doneSections }
          return { ...prev, pages }
        })

        await new Promise(r => setTimeout(r, 300))
      } catch (e) {
        // continue
      }
    }

    setGenerationState({ isGenerating: false, currentPage: 0, totalPages, progress: 100 })
    setIsGeneratingAll(false)
    toast({ title: "Generation complete", description: `All ${totalPages} slides are ready` })
  }

  if (!doc || doc.pages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">No slides found in document</p>
      </div>
    )
  }

  const currentPage = doc.pages[doc.currentPageIndex]

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left sidebar */}
      <PageSidebar
        pages={doc.pages}
        currentPageIndex={doc.currentPageIndex}
        onSelectPage={handleSelectPage}
        generationState={generationState}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* AI Generate bar */}
        <div className="h-10 border-b border-border/60 px-4 flex items-center gap-3 bg-card/30 shrink-0">
          <Button
            size="sm"
            onClick={handleGenerateAll}
            disabled={isGeneratingAll}
            className="h-7 text-xs gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30"
            variant="ghost"
          >
            {isGeneratingAll ? (
              <><Loader2 className="w-3 h-3 animate-spin" />Generating all slides...</>
            ) : (
              <><Sparkles className="w-3 h-3" />Generate all slides with AI</>
            )}
          </Button>
          {generationState.isGenerating && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-24 bg-muted/60 rounded-full h-1 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${generationState.progress}%` }}
                />
              </div>
              <span>{generationState.progress}%</span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
            <span>Slide {doc.currentPageIndex + 1} of {doc.pages.length}</span>
          </div>
        </div>

        {currentPage && (
          <PagePreview
            page={currentPage}
            onUpdatePage={handleUpdatePage}
            onAddSection={handleAddSection}
            onDownload={handleDownload}
          />
        )}
      </div>
    </div>
  )
}
