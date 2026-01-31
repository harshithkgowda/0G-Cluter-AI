"use client"

import { useState } from 'react'
import { History, FileText, Presentation, File, Trash2, ExternalLink, Clock, Shield, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { GenerationHistoryItem } from '@/hooks/use-generation-history'

interface HistoryPanelProps {
  history: GenerationHistoryItem[]
  onRemove: (id: string) => void
  onClear: () => void
  isOpen: boolean
  onClose: () => void
}

const typeIcons = {
  paper: FileText,
  ppt: Presentation,
  word: File,
}

const typeLabels = {
  paper: 'Paper',
  ppt: 'Presentation',
  word: 'Document',
}

const typeColors = {
  paper: 'text-blue-500 bg-blue-500/10',
  ppt: 'text-orange-500 bg-orange-500/10',
  word: 'text-indigo-500 bg-indigo-500/10',
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  
  return new Date(timestamp).toLocaleDateString()
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function HistoryPanel({ history, onRemove, onClear, isOpen, onClose }: HistoryPanelProps) {
  const [filter, setFilter] = useState<'all' | 'paper' | 'ppt' | 'word'>('all')
  
  const filteredHistory = filter === 'all' 
    ? history 
    : history.filter(item => item.type === filter)

  return (
    <div className={cn(
      "fixed inset-y-0 right-0 w-full sm:w-96 bg-background border-l border-border shadow-xl z-50 transition-transform duration-300",
      isOpen ? "translate-x-0" : "translate-x-full"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold">Generation History</h2>
          <Badge variant="secondary">{history.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClear}
              className="text-destructive hover:text-destructive"
            >
              Clear All
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 p-3 border-b">
        {(['all', 'paper', 'ppt', 'word'] as const).map((type) => (
          <Button
            key={type}
            variant={filter === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(type)}
            className="text-xs"
          >
            {type === 'all' ? 'All' : typeLabels[type]}
          </Button>
        ))}
      </div>

      {/* History List */}
      <ScrollArea className="h-[calc(100vh-140px)]">
        {filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <History className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">No generations yet</p>
            <p className="text-xs mt-1">Your generated documents will appear here</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {filteredHistory.map((item) => {
              const Icon = typeIcons[item.type]
              
              return (
                <div
                  key={item.id}
                  className="group relative p-3 rounded-lg border border-border/50 hover:border-border hover:bg-muted/50 transition-all"
                >
                  <div className="flex items-start gap-3">
                    {/* Type Icon */}
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      typeColors[item.type]
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm truncate">{item.title || item.fileName}</h3>
                        {item.zeroGHash && (
                          <Shield className="w-3 h-3 text-emerald-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {item.prompt.slice(0, 60)}...
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(item.createdAt)}
                        </span>
                        <span>{formatFileSize(item.fileSize)}</span>
                        {item.slideCount && (
                          <span>{item.slideCount} slides</span>
                        )}
                      </div>
                      {item.zeroGHash && (
                        <div className="flex items-center gap-1 mt-2">
                          <code className="text-xs font-mono text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded truncate max-w-[200px]">
                            {item.zeroGHash.slice(0, 20)}...
                          </code>
                          <a
                            href={`https://chainscan-newton.0g.ai/tx/${item.zeroGHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-500 hover:text-emerald-600"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={() => onRemove(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

// Toggle button for history panel
export function HistoryToggle({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="relative bg-transparent px-2 sm:px-3"
    >
      <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
      <span className="hidden sm:inline">History</span>
      {count > 0 && (
        <Badge 
          variant="secondary" 
          className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center text-[10px] sm:text-xs"
        >
          {count}
        </Badge>
      )}
    </Button>
  )
}
