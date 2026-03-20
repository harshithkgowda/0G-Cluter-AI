import { cn } from "@/lib/utils"

interface FadeInProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
}

export function FadeIn({ children, delay = 0, duration = 500, className }: FadeInProps) {
  return (
    <div
      className={cn("animate-in fade-in", className)}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  )
}

interface SlideInProps {
  children: React.ReactNode
  direction?: "left" | "right" | "up" | "down"
  delay?: number
  duration?: number
  className?: string
}

export function SlideIn({ children, direction = "up", delay = 0, duration = 500, className }: SlideInProps) {
  const directionClass = {
    left: "slide-in-from-left",
    right: "slide-in-from-right",
    up: "slide-in-from-bottom",
    down: "slide-in-from-top",
  }[direction]

  return (
    <div
      className={cn("animate-in", directionClass, className)}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  )
}

interface ScaleInProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
}

export function ScaleIn({ children, delay = 0, duration = 500, className }: ScaleInProps) {
  return (
    <div
      className={cn("animate-in zoom-in-95", className)}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  )
}

interface PulseProps {
  children: React.ReactNode
  className?: string
}

export function Pulse({ children, className }: PulseProps) {
  return <div className={cn("animate-pulse", className)}>{children}</div>
}

interface StaggerContainerProps {
  children: React.ReactNode
  staggerDelay?: number
  className?: string
}

export function StaggerContainer({ children, staggerDelay = 100, className }: StaggerContainerProps) {
  const childrenArray = Array.isArray(children) ? children : [children]

  return (
    <div className={className}>
      {childrenArray.map((child, i) => (
        <div key={i} style={{ animationDelay: `${i * staggerDelay}ms` }}>
          {child}
        </div>
      ))}
    </div>
  )
}
