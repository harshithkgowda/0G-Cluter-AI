"use client"

import { useEffect, useState } from "react"

interface TypingAnimationProps {
  text: string
  speed?: number
  onComplete?: () => void
}

export function TypingAnimation({ text, speed = 10, onComplete }: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index])
        setIndex((prev) => prev + 1)
      }, speed)

      return () => clearTimeout(timeout)
    } else if (index === text.length && text.length > 0) {
      onComplete?.()
    }
  }, [index, text, speed, onComplete])

  return (
    <div className="relative">
      <span className="text-foreground">{displayedText}</span>
      {index < text.length && (
        <span className="ml-1 inline-block h-5 w-0.5 bg-gradient-to-b from-emerald-500 to-teal-500 animate-pulse" />
      )}
    </div>
  )
}
