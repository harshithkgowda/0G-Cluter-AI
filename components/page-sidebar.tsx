"use client"

import { DocumentPage, GenerationState } from "@/types/document"
import { cn } from "@/lib/utils"
import { ChevronRight, FileText, Loader2, Zap } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FadeIn } from "./animations"

interface PageSidebarProps {
  pages: DocumentPage[]
  currentPageIndex: number
  onSelectPage: (index: number) => void
  generationState: GenerationState
}

export function PageSidebar({
  pages,
  currentPageIndex,
  onSelectPage,
  generationState,
}: PageSidebarProps) {
  return (
    <div className="w-64 border-r border-border bg-background/50 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-500" />
          Document Pages
        </h2>
        <p className="text-xs text-muted-foreground mt-1">{pages.length} pages</p>
      </div>

      {/* Pages List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-3">
          {pages.map((page, index) => (
            <button
              key={page.id}
              onClick={() => onSelectPage(index)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 group",
                "hover:shadow-glow hover-lift",
                index === currentPageIndex
                  ? "bg-emerald-500/20 border border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                  : "bg-muted/20 border border-border/50 hover:bg-muted/30"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    Page {page.pageNumber}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{page.title}</p>
                </div>
                {generationState.isGenerating && generationState.currentPage === index && (
                  <Loader2 className="w-3 h-3 text-emerald-500 animate-spin ml-2" />
                )}
              </div>

              {/* Section Count with pulse when active */}
              <div className="text-[10px] text-muted-foreground mt-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  {index === currentPageIndex && (
                    <Zap className="w-2.5 h-2.5 text-emerald-500 animate-pulse" />
                  )}
                  {page.sections.length} sections
                </span>
                {index === currentPageIndex && (
                  <ChevronRight className="w-3 h-3 text-emerald-500 transition-all group-hover:translate-x-0.5" />
                )}
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Generation Progress */}
      {generationState.isGenerating && (
        <div className="px-4 py-3 border-t border-border bg-emerald-500/5">
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">Generating...</p>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                style={{ width: `${generationState.progress}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Page {generationState.currentPage + 1} of {generationState.totalPages}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
