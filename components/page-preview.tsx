"use client"

import { DocumentPage } from "@/types/document"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SectionEditor } from "./section-editor"
import { Button } from "@/components/ui/button"
import { Plus, Download, Layers } from "lucide-react"

interface PagePreviewProps {
  page: DocumentPage
  onUpdatePage: (page: DocumentPage) => void
  onAddSection: () => void
  onDownload: () => void
}

export function PagePreview({ page, onUpdatePage, onAddSection, onDownload }: PagePreviewProps) {
  const handleUpdateSection = (idx: number, updated: any) => {
    const sections = [...page.sections]
    sections[idx] = updated
    onUpdatePage({ ...page, sections })
  }

  const handleDeleteSection = (idx: number) => {
    onUpdatePage({ ...page, sections: page.sections.filter((_, i) => i !== idx) })
  }

  // Determine slide layout
  const titleSection = page.sections.find(s => s.type === "title")
  const bodySection = page.sections.filter(s => s.type !== "title")

  return (
    <div className="flex-1 flex flex-col bg-background min-w-0 overflow-hidden">
      {/* Toolbar */}
      <div className="h-12 border-b border-border/60 px-5 flex items-center justify-between bg-card/40 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium text-foreground">{page.title || `Slide ${page.pageNumber}`}</span>
          <span className="text-border">·</span>
          <span>Slide {page.pageNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onDownload} className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground">
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
          <Button size="sm" onClick={onAddSection} className="h-7 text-xs gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white">
            <Plus className="w-3.5 h-3.5" />
            Add Block
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-8 py-8 space-y-8">

          {/* === 16:9 SLIDE CANVAS === */}
          <div className="max-w-4xl mx-auto">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-medium">Slide Preview</p>
            {/* 16:9 aspect ratio wrapper */}
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <div className="absolute inset-0 rounded-xl overflow-hidden border border-border/60 bg-[#0f1117] shadow-2xl shadow-black/40">
                {/* Subtle grid background */}
                <div className="absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                    backgroundSize: "40px 40px"
                  }}
                />

                {/* Slide content — strictly clipped inside canvas */}
                <div className="absolute inset-0 flex flex-col justify-center px-[8%] py-[7%] gap-[3%] overflow-hidden">
                  {/* Title */}
                  {titleSection ? (
                    <h2 className="gradient-text font-bold leading-tight shrink-0"
                      style={{ fontSize: "clamp(14px, 3.5vw, 36px)", maxWidth: "90%" }}>
                      {titleSection.content || "Untitled Slide"}
                    </h2>
                  ) : null}

                  {/* Body content */}
                  <div className="flex-1 overflow-hidden space-y-[2%]">
                    {bodySection.map((section) => (
                      <div key={section.id} className="overflow-hidden">
                        {section.type === "heading" ? (
                          <h3 className="text-foreground font-semibold leading-tight"
                            style={{ fontSize: "clamp(11px, 2vw, 22px)" }}>
                            {section.content}
                          </h3>
                        ) : (
                          <p className="text-foreground/70 leading-snug"
                            style={{ fontSize: "clamp(9px, 1.4vw, 16px)" }}>
                            {section.content}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Slide number badge */}
                <div className="absolute bottom-3 right-4 text-[10px] text-white/30 font-mono">
                  {page.pageNumber}
                </div>

                {/* Emerald accent line at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500/60 via-teal-400/40 to-transparent" />
              </div>
            </div>
          </div>

          {/* === EDIT PANELS === */}
          <div className="max-w-4xl mx-auto">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-medium">Edit Content</p>
            <div className="space-y-3">
              {page.sections.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border/40 rounded-xl">
                  No content blocks yet. Click "Add Block" to start.
                </div>
              ) : (
                page.sections.map((section, index) => (
                  <SectionEditor
                    key={section.id}
                    section={section}
                    onUpdate={(updated) => handleUpdateSection(index, updated)}
                    onDelete={() => handleDeleteSection(index)}
                    pageContext={page.title}
                  />
                ))
              )}
            </div>
          </div>

        </div>
      </ScrollArea>
    </div>
  )
}
