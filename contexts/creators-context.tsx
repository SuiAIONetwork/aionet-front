"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

interface Channel {
  id: string
  name: string
  type: 'free' | 'premium' | 'vip'
  price: number // in SUI (default price, usually for 30 days)
  description: string
  subscribers: number
  subscriptionPackages?: string[] // Available durations: ["30", "60", "90"]
  pricing?: {
    thirtyDays?: number
    sixtyDays?: number
    ninetyDays?: number
  }
  availability?: {
    hasLimit: boolean
    currentSlots?: number
    maxSlots?: number
    status: 'available' | 'limited' | 'full'
  }
  // Channel-specific data for individual channel cards
  channelCategories?: string[]
  channelRole?: string
  channelLanguage?: string
}

interface Creator {
  id: string
  creatorAddress: string // Wallet address of the creator (for ownership verification)
  name: string
  username: string
  avatar: string
  coverImage?: string // Optional cover image for banner background
  role: string
  tier: 'PRO' | 'ROYAL' // Status tier (NOMADS not allowed as creators)
  subscribers: number
  category: string // Primary category (for backward compatibility)
  categories: string[] // All selected categories
  channels: Channel[]
  contentTypes: string[]
  verified: boolean
  languages: string[]
  availability: {
    hasLimit: boolean
    currentSlots?: number
    maxSlots?: number
    status: 'available' | 'limited' | 'full'
  }
  socialLinks: {
    website?: string
    twitter?: string
    discord?: string
  }
  bannerColor: string
}

interface CreatorsContextType {
  creators: Creator[]
  addCreator: (creator: Creator) => void
  updateCreator: (id: string, creator: Partial<Creator>) => void
  removeCreator: (id: string) => void
}

const CreatorsContext = createContext<CreatorsContextType | undefined>(undefined)

// No mock data - using database creators
const initialMockCreators: Creator[] = [
]



export function CreatorsProvider({ children }: { children: React.ReactNode }) {
  const [creators, setCreators] = useState<Creator[]>(initialMockCreators)

  // Load creators from localStorage on client side
  useEffect(() => {
    const savedCreators = localStorage.getItem("aio-creators")
    if (savedCreators) {
      try {
        const parsedCreators = JSON.parse(savedCreators)
        setCreators(parsedCreators)
      } catch (error) {
        console.error("Failed to parse saved creators:", error)
        setCreators(initialMockCreators)
      }
    }
  }, [])

  // Save creators to localStorage when they change
  useEffect(() => {
    localStorage.setItem("aio-creators", JSON.stringify(creators))
  }, [creators])

  const addCreator = (creator: Creator) => {
    setCreators(prev => [...prev, creator])
  }

  const updateCreator = (id: string, updatedCreator: Partial<Creator>) => {
    setCreators(prev => prev.map(creator => 
      creator.id === id ? { ...creator, ...updatedCreator } : creator
    ))
  }

  const removeCreator = (id: string) => {
    setCreators(prev => prev.filter(creator => creator.id !== id))
  }

  return (
    <CreatorsContext.Provider
      value={{
        creators,
        addCreator,
        updateCreator,
        removeCreator,
      }}
    >
      {children}
    </CreatorsContext.Provider>
  )
}

export function useCreators() {
  const context = useContext(CreatorsContext)
  if (context === undefined) {
    throw new Error("useCreators must be used within a CreatorsProvider")
  }
  return context
}

export type { Creator, Channel }
