"use client"

import { Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingState {
  isLoading: boolean
  message?: string
  progress?: number
}

interface GeneratingIndicatorProps {
  state: LoadingState
  className?: string
}

export function GeneratingIndicator({ state, className }: GeneratingIndicatorProps) {
  if (!state.isLoading) return null

  return (
    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20", className)}>
      <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
      <span className="text-sm font-medium text-emerald-600">
        {state.message || "Generating..."}
      </span>
      {state.progress !== undefined && (
        <span className="text-xs text-emerald-500 ml-auto">
          {Math.round(state.progress)}%
        </span>
      )}
    </div>
  )
}

interface SkeletonLoaderProps {
  lines?: number
  className?: string
}

export function SkeletonLoader({ lines = 3, className }: SkeletonLoaderProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-muted rounded-full w-full animate-pulse" />
          <div className="h-4 bg-muted rounded-full w-5/6 animate-pulse" />
        </div>
      ))}
    </div>
  )
}

interface PageGeneratingProps {
  pageNumber: number
  totalPages: number
  currentSection?: string
}

export function PageGenerating({ pageNumber, totalPages, currentSection }: PageGeneratingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full animate-pulse" />
        <div className="absolute inset-2 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-emerald-500 animate-bounce" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-foreground">
          Generating Page {pageNumber} of {totalPages}
        </p>
        {currentSection && (
          <p className="text-sm text-muted-foreground">
            Creating: <span className="capitalize text-foreground font-medium">{currentSection}</span>
          </p>
        )}
      </div>
      <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse"
          style={{
            width: `${(pageNumber / totalPages) * 100}%`,
          }}
        />
      </div>
    </div>
  )
}
