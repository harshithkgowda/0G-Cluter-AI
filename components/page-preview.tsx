"use client"

import { DocumentPage } from "@/types/document"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SectionEditor } from "./section-editor"
import { Button } from "@/components/ui/button"
import { Plus, Download, Share2 } from "lucide-react"
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
      <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-background/50 backdrop-blur-sm">
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

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
          {page.sections.length === 0 ? (
            <FadeIn>
              <div className="text-center py-12">
                <p className="text-muted-foreground">No sections yet. Add one to get started.</p>
              </div>
            </FadeIn>
          ) : (
            page.sections.map((section, index) => (
              <SlideIn key={section.id} direction="up" delay={index * 50}>
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
      </ScrollArea>
    </div>
  )
}
