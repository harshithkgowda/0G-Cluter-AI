"use client"

import { DocumentSection } from "@/types/document"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Edit2, Copy, Trash2, Save, X, Wand2, Loader2, Check, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface SectionEditorProps {
  section: DocumentSection
  onUpdate: (section: DocumentSection) => void
  onDelete: () => void
  pageContext?: string
}

// Streaming typing hook
function useTypingStream(target: string, isStreaming: boolean) {
  const [displayed, setDisplayed] = useState("")
  const indexRef = useRef(0)

  useEffect(() => {
    if (!isStreaming) {
      setDisplayed(target)
      indexRef.current = target.length
      return
    }
    // Reset on new stream
    setDisplayed("")
    indexRef.current = 0

    const interval = setInterval(() => {
      if (indexRef.current < target.length) {
        indexRef.current++
        setDisplayed(target.slice(0, indexRef.current))
      } else {
        clearInterval(interval)
      }
    }, 18)

    return () => clearInterval(interval)
  }, [target, isStreaming])

  return displayed
}

export function SectionEditor({ section, onUpdate, onDelete, pageContext }: SectionEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(section.content)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [streamedContent, setStreamedContent] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [regenerationPrompt, setRegenerationPrompt] = useState("")
  const [showRegenerateForm, setShowRegenerateForm] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const { toast } = useToast()

  const displayedText = useTypingStream(streamedContent, isStreaming)

  const handleSave = () => {
    onUpdate({ ...section, content: editContent })
    setIsEditing(false)
  }

  const handleRegenerate = async () => {
    if (!regenerationPrompt.trim()) return
    setIsRegenerating(true)
    setIsStreaming(false)
    setStreamedContent("")

    try {
      const response = await fetch("/api/regenerate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionType: section.type,
          currentContent: section.content,
          regenerationPrompt: regenerationPrompt.trim(),
          pageContext,
        }),
      })

      if (!response.ok) throw new Error("Failed to regenerate")
      const data = await response.json()

      // Trigger typing animation
      setIsStreaming(true)
      setStreamedContent(data.content)

      // After animation finishes, commit
      const duration = data.content.length * 18 + 200
      setTimeout(() => {
        setIsStreaming(false)
        onUpdate({ ...section, content: data.content })
        setRegenerationPrompt("")
        setShowRegenerateForm(false)
        toast({ title: "Section updated", description: "AI rewrote this block" })
      }, duration)
    } catch (error) {
      toast({ title: "Regeneration failed", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" })
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(section.content)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const typeLabel: Record<string, string> = {
    title: "Title",
    heading: "Heading",
    paragraph: "Body",
    bullet: "Bullet",
  }

  return (
    <div className={cn(
      "group rounded-xl border transition-all duration-200",
      isStreaming
        ? "border-emerald-500/50 bg-emerald-500/5 shadow-sm shadow-emerald-500/10"
        : "border-border/50 bg-card/40 hover:border-border/80 hover:bg-card/60"
    )}>
      {/* Header row */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          {isStreaming && <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />}
          <span className={cn(
            "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full",
            section.type === "title"
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-muted/60 text-muted-foreground"
          )}>
            {typeLabel[section.type] || section.type}
          </span>
          {isStreaming && (
            <span className="text-[10px] text-emerald-400 font-medium animate-pulse">AI writing...</span>
          )}
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isEditing && !isStreaming && (
            <>
              <Button size="sm" variant="ghost" onClick={() => { setIsEditing(true); setEditContent(section.content) }}
                className="h-6 w-6 p-0 hover:bg-muted/60" title="Edit">
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowRegenerateForm(!showRegenerateForm)}
                className="h-6 w-6 p-0 hover:bg-muted/60" title="Regenerate with AI">
                <Wand2 className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCopy}
                className="h-6 w-6 p-0 hover:bg-muted/60" title="Copy">
                {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={onDelete}
                className="h-6 w-6 p-0 hover:bg-destructive/10 text-destructive/60 hover:text-destructive" title="Delete">
                <Trash2 className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="px-3 py-3">
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-24 text-sm bg-background/60 border-border/50 resize-none"
              placeholder="Edit content..."
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600 text-white">
                <Save className="w-3 h-3 mr-1" /> Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="h-7 text-xs">
                <X className="w-3 h-3 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className={cn(
            "text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap",
            section.type === "title" && "text-base font-semibold"
          )}>
            {isStreaming ? (
              <span>
                {displayedText}
                <span className="inline-block w-0.5 h-4 bg-emerald-400 ml-0.5 align-text-bottom animate-[blink_0.8s_ease-in-out_infinite]" />
              </span>
            ) : (
              section.content || <span className="text-muted-foreground italic text-xs">Empty — click edit to add content</span>
            )}
          </div>
        )}
      </div>

      {/* AI Regenerate form */}
      {showRegenerateForm && !isEditing && !isStreaming && (
        <div className="mx-3 mb-3 p-3 rounded-lg bg-background/60 border border-emerald-500/20 space-y-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Wand2 className="w-3 h-3 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">Regenerate with AI</span>
          </div>
          <Textarea
            value={regenerationPrompt}
            onChange={(e) => setRegenerationPrompt(e.target.value)}
            placeholder="Describe what you want... e.g. 'Make it shorter and more formal'"
            className="min-h-16 text-xs bg-background/40 border-border/40 resize-none"
            onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) handleRegenerate() }}
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleRegenerate}
              disabled={isRegenerating || !regenerationPrompt.trim()}
              className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600 text-white">
              {isRegenerating ? (
                <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Generating...</>
              ) : (
                <><Sparkles className="w-3 h-3 mr-1" />Generate</>
              )}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowRegenerateForm(false); setRegenerationPrompt("") }}
              className="h-7 text-xs">
              Cancel
            </Button>
            <span className="text-[10px] text-muted-foreground ml-auto">⌘ Enter to run</span>
          </div>
        </div>
      )}
    </div>
  )
}
