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
      className={cn("opacity-0 animate-pulse", className)}
      style={{
        animation: `fadeIn ${duration}ms ease-out ${delay}ms forwards`,
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
  const getTransform = () => {
    switch (direction) {
      case "left":
        return "translateX(-20px)"
      case "right":
        return "translateX(20px)"
      case "up":
        return "translateY(20px)"
      case "down":
        return "translateY(-20px)"
      default:
        return "translateY(20px)"
    }
  }

  return (
    <div
      className={cn("opacity-0", className)}
      style={{
        animation: `slideIn ${duration}ms ease-out ${delay}ms forwards`,
        "--slide-start": getTransform(),
      } as React.CSSProperties & { "--slide-start": string }}
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
