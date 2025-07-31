"use client"

import { useEffect, useState } from "react"

// This component creates placeholder images for the landing page
// You can replace these with actual images later

export function createPlaceholderDataURL(width: number, height: number, text: string, bgColor: string = "#1e293b", textColor: string = "#ffffff") {
  // Create a canvas element
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  
  if (!ctx) return ""
  
  // Fill background
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, width, height)
  
  // Add text
  ctx.fillStyle = textColor
  ctx.font = `${Math.max(width / 20, 14)}px sans-serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(text, width / 2, height / 2)
  
  // Convert to data URL
  return canvas.toDataURL("image/png")
}

export function usePlaceholderImage(width: number, height: number, text: string, bgColor?: string, textColor?: string) {
  const [dataURL, setDataURL] = useState("")
  
  useEffect(() => {
    setDataURL(createPlaceholderDataURL(width, height, text, bgColor, textColor))
  }, [width, height, text, bgColor, textColor])
  
  return dataURL
}

// Create placeholder images for the landing page
export function createPlaceholderImages() {
  // Only run on client side
  if (typeof window === "undefined") return {}
  
  return {
    logo: createPlaceholderDataURL(200, 50, "TradeCopy Logo", "#0f172a", "#ffffff"),
    dashboardPreview: createPlaceholderDataURL(1200, 800, "Dashboard Preview", "#1e293b", "#ffffff"),
    testimonial1: createPlaceholderDataURL(100, 100, "T1", "#3b82f6", "#ffffff"),
    testimonial2: createPlaceholderDataURL(100, 100, "T2", "#8b5cf6", "#ffffff"),
    testimonial3: createPlaceholderDataURL(100, 100, "T3", "#ec4899", "#ffffff"),
    testimonial4: createPlaceholderDataURL(100, 100, "T4", "#10b981", "#ffffff"),
    testimonial5: createPlaceholderDataURL(100, 100, "T5", "#f59e0b", "#ffffff"),
  }
}
