"use client"

import { DocumentPage, GenerationState } from "@/types/document"
import { cn } from "@/lib/utils"
import { Loader2, LayoutTemplate } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PageSidebarProps {
  pages: DocumentPage[]
  currentPageIndex: number
  onSelectPage: (index: number) => void
  generationState: GenerationState
}

export function PageSidebar({ pages, currentPageIndex, onSelectPage, generationState }: PageSidebarProps) {
  return (
    <div className="w-56 shrink-0 border-r border-border/60 bg-card/40 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/60 flex items-center gap-2">
        <LayoutTemplate className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-xs font-semibold text-foreground">Slides</span>
        <span className="ml-auto text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full">
          {pages.length}
        </span>
      </div>

      {/* Slides list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1.5">
          {pages.map((page, index) => {
            const isActive = index === currentPageIndex
            const isGenerating = generationState.isGenerating && generationState.currentPage === index

            return (
              <button
                key={page.id}
                onClick={() => onSelectPage(index)}
                className={cn(
                  "w-full text-left rounded-xl transition-all duration-200 overflow-hidden group",
                  isActive
                    ? "ring-1 ring-emerald-500/60 bg-emerald-500/10 shadow-sm shadow-emerald-500/10"
                    : "hover:bg-muted/40 ring-1 ring-transparent hover:ring-border/40"
                )}
              >
                {/* Slide thumbnail canvas */}
                <div className={cn(
                  "relative w-full aspect-video rounded-lg overflow-hidden flex flex-col p-2 gap-1",
                  isActive ? "bg-card/80" : "bg-muted/30"
                )}>
                  {/* Slide number badge */}
                  <div className={cn(
                    "absolute top-1.5 right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full z-10",
                    isActive
                      ? "bg-emerald-500 text-white"
                      : "bg-muted/80 text-muted-foreground"
                  )}>
                    {index + 1}
                  </div>

                  {/* Content preview */}
                  {page.sections.map((section, si) => (
                    <div
                      key={section.id}
                      className={cn(
                        "rounded overflow-hidden text-[5px] leading-tight truncate px-1",
                        section.type === "title"
                          ? "font-bold text-foreground bg-emerald-500/15 py-0.5"
                          : "text-muted-foreground bg-muted/40 py-0.5"
                      )}
                    >
                      {section.content.slice(0, 40) || "—"}
                    </div>
                  ))}

                  {/* Generating overlay */}
                  {isGenerating && (
                    <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-sm flex items-center justify-center">
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" />
                        <span className="text-[8px] text-emerald-400 font-medium">AI writing...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Label */}
                <div className="px-2 py-1.5">
                  <p className={cn(
                    "text-[10px] font-medium truncate",
                    isActive ? "text-emerald-400" : "text-muted-foreground"
                  )}>
                    {page.title || `Slide ${index + 1}`}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </ScrollArea>

      {/* Generation progress bar */}
      {generationState.isGenerating && (
        <div className="px-3 py-3 border-t border-border/60 bg-emerald-500/5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" />
              <span className="text-[10px] font-medium text-emerald-400">Generating</span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {generationState.currentPage + 1}/{generationState.totalPages}
            </span>
          </div>
          <div className="w-full bg-muted/60 rounded-full h-1 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${generationState.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
