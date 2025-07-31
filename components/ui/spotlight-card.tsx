"use client"

import { useRef, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SpotlightCardProps {
  children: ReactNode
  className?: string
  spotlightColor?: string
}

export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(77, 162, 255, 0.15)"
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return

    const rect = divRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    divRef.current.style.setProperty("--mouse-x", `${x}px`)
    divRef.current.style.setProperty("--mouse-y", `${y}px`)
    divRef.current.style.setProperty("--spotlight-color", spotlightColor)
  }

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative rounded-xl border-0 overflow-hidden",
        "dashboard-card",
        "before:content-[''] before:absolute before:inset-0 before:opacity-0 before:pointer-events-none",
        "before:transition-opacity before:duration-500",
        "hover:before:opacity-100 focus-within:before:opacity-100",
        "before:bg-[radial-gradient(circle_at_var(--mouse-x)_var(--mouse-y),var(--spotlight-color),transparent_80%)]",
        "after:content-[''] after:absolute after:inset-0 after:opacity-0 after:pointer-events-none",
        "after:transition-opacity after:duration-500 hover:after:opacity-100",
        "after:bg-[radial-gradient(circle_at_var(--mouse-x)_var(--mouse-y),transparent_40%,var(--spotlight-color)_200%)]",
        "transition-all duration-300",
        className
      )}
      style={{
        "--mouse-x": "50%",
        "--mouse-y": "50%",
        "--spotlight-color": spotlightColor,
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
}
