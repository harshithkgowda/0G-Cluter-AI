"use client"

import { useState, useEffect, useCallback } from "react"

const CREDITS_STORAGE_KEY = "cluter_ai_credits"
const INITIAL_CREDITS = 30

export interface CreditsData {
  credits: number
  totalUsed: number
  lastUpdated: number
  isPremium: boolean
  subscriptionEnd?: number
}

export function useCredits() {
  const [creditsData, setCreditsData] = useState<CreditsData>({
    credits: INITIAL_CREDITS,
    totalUsed: 0,
    lastUpdated: Date.now(),
    isPremium: false,
  })
  const [isLoaded, setIsLoaded] = useState(false)

  // Load credits from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(CREDITS_STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as CreditsData
          // Check if subscription has expired
          if (parsed.subscriptionEnd && parsed.subscriptionEnd < Date.now()) {
            parsed.isPremium = false
            parsed.subscriptionEnd = undefined
          }
          setCreditsData(parsed)
        } catch (e) {
          console.error("[v0] Error parsing credits data:", e)
          // Initialize with default credits
          const initialData: CreditsData = {
            credits: INITIAL_CREDITS,
            totalUsed: 0,
            lastUpdated: Date.now(),
            isPremium: false,
          }
          localStorage.setItem(CREDITS_STORAGE_KEY, JSON.stringify(initialData))
          setCreditsData(initialData)
        }
      } else {
        // First time user - give them free credits
        const initialData: CreditsData = {
          credits: INITIAL_CREDITS,
          totalUsed: 0,
          lastUpdated: Date.now(),
          isPremium: false,
        }
        localStorage.setItem(CREDITS_STORAGE_KEY, JSON.stringify(initialData))
        setCreditsData(initialData)
      }
      setIsLoaded(true)
    }
  }, [])

  // Save to localStorage whenever credits change
  const saveCredits = useCallback((data: CreditsData) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CREDITS_STORAGE_KEY, JSON.stringify(data))
      setCreditsData(data)
    }
  }, [])

  // Use credits for an action
  const useCredits = useCallback((amount: number = 1): boolean => {
    if (creditsData.isPremium) {
      // Premium users have unlimited credits
      const newData = {
        ...creditsData,
        totalUsed: creditsData.totalUsed + amount,
        lastUpdated: Date.now(),
      }
      saveCredits(newData)
      return true
    }

    if (creditsData.credits < amount) {
      return false
    }

    const newData = {
      ...creditsData,
      credits: creditsData.credits - amount,
      totalUsed: creditsData.totalUsed + amount,
      lastUpdated: Date.now(),
    }
    saveCredits(newData)
    return true
  }, [creditsData, saveCredits])

  // Add credits (after purchase)
  const addCredits = useCallback((amount: number) => {
    const newData = {
      ...creditsData,
      credits: creditsData.credits + amount,
      lastUpdated: Date.now(),
    }
    saveCredits(newData)
  }, [creditsData, saveCredits])

  // Activate premium subscription
  const activatePremium = useCallback((durationDays: number) => {
    const newData = {
      ...creditsData,
      isPremium: true,
      subscriptionEnd: Date.now() + durationDays * 24 * 60 * 60 * 1000,
      lastUpdated: Date.now(),
    }
    saveCredits(newData)
  }, [creditsData, saveCredits])

  // Reset credits (for testing)
  const resetCredits = useCallback(() => {
    const initialData: CreditsData = {
      credits: INITIAL_CREDITS,
      totalUsed: 0,
      lastUpdated: Date.now(),
      isPremium: false,
    }
    saveCredits(initialData)
  }, [saveCredits])

  return {
    credits: creditsData.credits,
    totalUsed: creditsData.totalUsed,
    isPremium: creditsData.isPremium,
    subscriptionEnd: creditsData.subscriptionEnd,
    isLoaded,
    useCredits,
    addCredits,
    activatePremium,
    resetCredits,
    hasCredits: creditsData.isPremium || creditsData.credits > 0,
  }
}
