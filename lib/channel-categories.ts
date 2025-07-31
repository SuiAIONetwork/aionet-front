/**
 * Centralized Channel Categories Configuration
 * This file contains the standardized categories used throughout the application
 */

import { TrendingUp, Coins, Play, FileText, BookOpen, Brain, Bot, Tractor, Zap, Users } from "lucide-react"

// Standardized channel categories
export const CHANNEL_CATEGORIES = [
  "Trading",
  "DeFi", 
  "NFTs",
  "Market Analysis",
  "Education",
  "AI Education",
  "Algo Trading",
  "Farming",
  "Meme Coins"
] as const

// Categories with icons for UI components
export const CHANNEL_CATEGORIES_WITH_ICONS = [
  { value: "all", label: "All Categories", icon: Users },
  { value: "trading", label: "Trading", icon: TrendingUp },
  { value: "defi", label: "DeFi", icon: Coins },
  { value: "nfts", label: "NFTs", icon: Play },
  { value: "market analysis", label: "Market Analysis", icon: FileText },
  { value: "education", label: "Education", icon: BookOpen },
  { value: "ai education", label: "AI Education", icon: Brain },
  { value: "algo trading", label: "Algo Trading", icon: Bot },
  { value: "farming", label: "Farming", icon: Tractor },
  { value: "meme coins", label: "Meme Coins", icon: Zap }
] as const

// Type for channel categories
export type ChannelCategory = typeof CHANNEL_CATEGORIES[number]

// Helper function to get category icon
export function getCategoryIcon(category: string) {
  const categoryItem = CHANNEL_CATEGORIES_WITH_ICONS.find(
    item => item.value.toLowerCase() === category.toLowerCase()
  )
  return categoryItem?.icon || Users
}

// Helper function to normalize category values for comparison
export function normalizeCategory(category: string): string {
  return category.toLowerCase().trim()
}

// Helper function to validate if a category is valid
export function isValidCategory(category: string): boolean {
  const normalized = normalizeCategory(category)
  return CHANNEL_CATEGORIES_WITH_ICONS.some(
    item => normalizeCategory(item.label) === normalized
  )
}
