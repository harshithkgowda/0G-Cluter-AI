"use client"

import { useDocument } from "@/hooks/use-document"
import { Document } from "@/types/document"
import { useState, useEffect } from "react"
import { PageSidebar } from "./page-sidebar"
import { PagePreview } from "./page-preview"
import { useToast } from "@/hooks/use-toast"

interface DocumentEditorProps {
  document: Document
  onDocumentChange?: (document: Document) => void
}

export function DocumentEditor({ document: initialDocument, onDocumentChange }: DocumentEditorProps) {
  const {
    document,
    setDocument,
    generationState,
    updatePage,
    setCurrentPage,
  } = useDocument()

  const { toast } = useToast()

  useEffect(() => {
    setDocument(initialDocument)
  }, [initialDocument, setDocument])

  if (!document) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    )
  }

  const currentPage = document.pages[document.currentPageIndex]

  const handleUpdatePage = (updatedPage: any) => {
    updatePage(document.currentPageIndex, updatedPage)
    if (onDocumentChange) {
      const updatedDoc = { ...document }
      updatedDoc.pages[document.currentPageIndex] = updatedPage
      onDocumentChange(updatedDoc)
    }
  }

  const handleDownload = async () => {
    try {
      // TODO: Implement download functionality
      toast({
        title: "Download started",
        description: "Your document is being prepared...",
      })
    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was an error downloading your document",
        variant: "destructive",
      })
    }
  }

  const handleAddSection = () => {
    const newSection = {
      id: `section-${Date.now()}`,
      type: "paragraph" as const,
      content: "",
      isEditing: true,
    }
    const updatedPage = {
      ...currentPage,
      sections: [...currentPage.sections, newSection],
    }
    handleUpdatePage(updatedPage)
  }

  return (
    <div className="w-full h-screen flex bg-background overflow-hidden">
      {/* Sidebar */}
      <PageSidebar
        pages={document.pages}
        currentPageIndex={document.currentPageIndex}
        onSelectPage={(index) => setCurrentPage(index)}
        generationState={generationState}
      />

      {/* Main Editor */}
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
