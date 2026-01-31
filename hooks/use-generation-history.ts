"use client"

import { useState, useEffect, useCallback } from 'react'

export interface GenerationHistoryItem {
  id: string
  type: 'paper' | 'ppt' | 'word'
  title: string
  prompt: string
  fileName: string
  fileSize: number
  createdAt: number
  zeroGHash?: string
  templateUsed?: string
  slideCount?: number
}

const STORAGE_KEY = 'docugen_history'
const MAX_HISTORY_ITEMS = 50

export function useGenerationHistory() {
  const [history, setHistory] = useState<GenerationHistoryItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load history from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as GenerationHistoryItem[]
          setHistory(parsed)
        }
      } catch (error) {
        console.error('[v0] Error loading history:', error)
      }
      setIsLoaded(true)
    }
  }, [])

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
      } catch (error) {
        console.error('[v0] Error saving history:', error)
      }
    }
  }, [history, isLoaded])

  const addToHistory = useCallback((item: Omit<GenerationHistoryItem, 'id' | 'createdAt'>) => {
    const newItem: GenerationHistoryItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    }

    setHistory(prev => {
      const updated = [newItem, ...prev].slice(0, MAX_HISTORY_ITEMS)
      return updated
    })

    return newItem.id
  }, [])

  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id))
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  const getHistoryByType = useCallback((type: 'paper' | 'ppt' | 'word') => {
    return history.filter(item => item.type === type)
  }, [history])

  return {
    history,
    isLoaded,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getHistoryByType,
  }
}
