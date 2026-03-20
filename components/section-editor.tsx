"use client"

import { DocumentSection } from "@/types/document"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  Edit2,
  RefreshCw,
  Copy,
  Trash2,
  Save,
  X,
  Wand2,
  Loader2,
  Check,
} from "lucide-react"
import { TypingAnimation } from "./typing-animation"

interface SectionEditorProps {
  section: DocumentSection
  onUpdate: (section: DocumentSection) => void
  onDelete: () => void
  pageContext?: string
}

export function SectionEditor({
  section,
  onUpdate,
  onDelete,
  pageContext,
}: SectionEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(section.content)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [regenerationPrompt, setRegenerationPrompt] = useState("")
  const [showRegenerateForm, setShowRegenerateForm] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const { toast } = useToast()

  const handleSave = () => {
    onUpdate({
      ...section,
      content: editContent,
      isEditing: false,
    })
    setIsEditing(false)
  }

  const handleRegenerate = async () => {
    if (!regenerationPrompt.trim()) return
    setIsRegenerating(true)
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

      if (!response.ok) {
        throw new Error("Failed to regenerate section")
      }

      const data = await response.json()

      onUpdate({
        ...section,
        content: data.content,
        isGenerating: false,
      })

      setRegenerationPrompt("")
      setShowRegenerateForm(false)

      toast({
        title: "Section regenerated",
        description: "Your content has been updated",
      })
    } catch (error) {
      console.error("[v0] Regeneration error:", error)
      toast({
        title: "Regeneration failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(section.content)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
    toast({
      title: "Copied to clipboard",
      description: "Section content copied successfully",
    })
  }

  return (
    <div className="bg-muted/30 border border-border/50 rounded-lg p-4 space-y-3 hover:border-border/80 transition-colors">
      {/* Section Type Badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium px-2.5 py-1 bg-emerald-500/20 text-emerald-600 rounded-full capitalize">
          {section.type}
        </span>
        <div className="flex items-center gap-1">
          {!isEditing && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="h-7 w-7 p-0 hover:bg-muted/50"
                title="Edit section"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowRegenerateForm(!showRegenerateForm)}
                className="h-7 w-7 p-0 hover:bg-muted/50"
                title="Regenerate with AI"
              >
                <Wand2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="h-7 w-7 p-0 hover:bg-muted/50"
                title="Copy section"
              >
                {isCopied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onDelete}
                className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                title="Delete section"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content Display/Edit */}
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-32 text-sm"
            placeholder="Edit content..."
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsEditing(false)
                setEditContent(section.content)
              }}
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
          {section.isGenerating ? (
            <TypingAnimation text={section.content} speed={20} />
          ) : (
            section.content
          )}
        </div>
      )}

      {/* Regenerate Form */}
      {showRegenerateForm && !isEditing && (
        <div className="bg-background/50 border border-border/50 rounded p-3 space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            What would you like to change?
          </label>
          <Textarea
            value={regenerationPrompt}
            onChange={(e) => setRegenerationPrompt(e.target.value)}
            placeholder="e.g., Make it more concise, Add more examples, Change the tone to formal..."
            className="min-h-20 text-xs"
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleRegenerate}
              disabled={isRegenerating || !regenerationPrompt.trim()}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Regenerate
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowRegenerateForm(false)
                setRegenerationPrompt("")
              }}
              className="text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
