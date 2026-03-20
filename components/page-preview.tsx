"use client"

import { DocumentPage } from "@/types/document"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SectionEditor } from "./section-editor"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import { FadeIn, SlideIn } from "./animations"

interface PagePreviewProps {
  page: DocumentPage
  onUpdatePage: (page: DocumentPage) => void
  onAddSection: () => void
  onDownload: () => void
}

export function PagePreview({
  page,
  onUpdatePage,
  onAddSection,
  onDownload,
}: PagePreviewProps) {
  const handleUpdateSection = (sectionIndex: number, updatedSection: any) => {
    const updatedSections = [...page.sections]
    updatedSections[sectionIndex] = updatedSection
    onUpdatePage({
      ...page,
      sections: updatedSections,
    })
  }

  const handleDeleteSection = (sectionIndex: number) => {
    const updatedSections = page.sections.filter((_, i) => i !== sectionIndex)
    onUpdatePage({
      ...page,
      sections: updatedSections,
    })
  }

  return (
    <div className="flex-1 bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <SlideIn direction="left">
          <div>
            <h1 className="text-2xl font-bold gradient-text">{page.title}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Page {page.pageNumber}</p>
          </div>
        </SlideIn>
        <SlideIn direction="right" delay={100}>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onDownload}
              className="gap-2 hover-lift"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button
              size="sm"
              onClick={onAddSection}
              className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white hover-lift"
            >
              <Plus className="w-4 h-4" />
              Add Section
            </Button>
          </div>
        </SlideIn>
      </div>

      {/* Slide Preview Container */}
      <ScrollArea className="flex-1">
        <div className="px-6 py-8">
          {/* Template Preview */}
          <div className="max-w-5xl mx-auto mb-8">
            <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg glass p-8 space-y-6 min-h-96">
              {/* Slide Content */}
              {page.sections.length === 0 ? (
                <FadeIn>
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No content on this slide</p>
                  </div>
                </FadeIn>
              ) : (
                page.sections.map((section, index) => (
                  <SlideIn key={section.id} direction="up" delay={index * 50}>
                    <div className="space-y-2">
                      {section.type === "title" ? (
                        <h2 className="text-3xl font-bold gradient-text leading-tight">
                          {section.content}
                        </h2>
                      ) : section.type === "heading" ? (
                        <h3 className="text-2xl font-semibold text-foreground">
                          {section.content}
                        </h3>
                      ) : (
                        <p className="text-base text-foreground/80 leading-relaxed whitespace-pre-wrap">
                          {section.content}
                        </p>
                      )}
                    </div>
                  </SlideIn>
                ))
              )}
            </div>
          </div>

          {/* Edit Section */}
          <div className="max-w-5xl mx-auto space-y-4 pb-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">Edit Content</h3>
            {page.sections.length === 0 ? (
              <FadeIn>
                <div className="text-center py-12 text-muted-foreground">
                  <p>No sections to edit. Add one to get started.</p>
                </div>
              </FadeIn>
            ) : (
              page.sections.map((section, index) => (
                <SlideIn key={`edit-${section.id}`} direction="up" delay={index * 50}>
                  <SectionEditor
                    section={section}
                    onUpdate={(updated) => handleUpdateSection(index, updated)}
                    onDelete={() => handleDeleteSection(index)}
                    pageContext={page.title}
                  />
                </SlideIn>
              ))
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
