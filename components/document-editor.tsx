"use client"

import { Document, DocumentPage } from "@/types/document"
import { useState, useEffect } from "react"
import { PageSidebar } from "./page-sidebar"
import { PagePreview } from "./page-preview"
import { useToast } from "@/hooks/use-toast"

interface DocumentEditorProps {
  document: Document
  onDocumentChange?: (document: Document) => void
}

export function DocumentEditor({ document: initialDocument, onDocumentChange }: DocumentEditorProps) {
  const [document, setDocument] = useState<Document>(initialDocument)
  const [generationState, setGenerationState] = useState({
    isGenerating: false,
    currentPage: 0,
    totalPages: document.pages.length,
    progress: 0,
  })
  const { toast } = useToast()

  useEffect(() => {
    setDocument(initialDocument)
    setGenerationState(prev => ({
      ...prev,
      totalPages: initialDocument.pages.length,
    }))
  }, [initialDocument])

  if (!document || document.pages.length === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">No pages in document</p>
      </div>
    )
  }

  const currentPage = document.pages[document.currentPageIndex]

  const handleUpdatePage = (updatedPage: DocumentPage) => {
    const updatedPages = [...document.pages]
    updatedPages[document.currentPageIndex] = updatedPage
    const updatedDoc = { ...document, pages: updatedPages }
    setDocument(updatedDoc)
    if (onDocumentChange) {
      onDocumentChange(updatedDoc)
    }
  }

  const handleDownload = async () => {
    try {
      toast({
        title: "Download started",
        description: "Preparing your document...",
      })
    } catch (error) {
      toast({
        title: "Download failed",
        variant: "destructive",
      })
    }
  }

  const handleAddSection = () => {
    const newSection = {
      id: `section-${Date.now()}`,
      type: "paragraph" as const,
      content: "New section - Click to edit",
      isEditing: false,
    }
    const updatedPage = {
      ...currentPage,
      sections: [...currentPage.sections, newSection],
    }
    handleUpdatePage(updatedPage)
  }

  return (
    <div className="w-full h-screen flex bg-background overflow-hidden">
      <PageSidebar
        pages={document.pages}
        currentPageIndex={document.currentPageIndex}
        onSelectPage={(index) => {
          setDocument({ ...document, currentPageIndex: index })
          if (onDocumentChange) {
            onDocumentChange({ ...document, currentPageIndex: index })
          }
        }}
        generationState={generationState}
      />

      {currentPage && (
        <PagePreview
          page={currentPage}
          onUpdatePage={handleUpdatePage}
          onAddSection={handleAddSection}
          onDownload={handleDownload}
        />
      )}
    </div>
  )
}
