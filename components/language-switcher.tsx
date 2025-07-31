"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Languages } from "lucide-react"

export function LanguageSwitcher() {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'el'>('en')

  const switchLanguage = (language: 'en' | 'el') => {
    setCurrentLanguage(language)

    if (language === 'el') {
      // Use Google Translate URL to translate to Greek
      const currentUrl = window.location.href
      const translateUrl = `https://translate.google.com/translate?sl=en&tl=el&u=${encodeURIComponent(currentUrl)}`
      window.open(translateUrl, '_blank')
    } else {
      // For English, just reload the current page (or you could open in new tab)
      window.location.reload()
    }
  }

  const getLanguageLabel = (lang: 'en' | 'el') => {
    switch (lang) {
      case 'en':
        return 'English'
      case 'el':
        return 'Ελληνικά'
      default:
        return 'English'
    }
  }

  const getFlag = (lang: 'en' | 'el') => {
    switch (lang) {
      case 'en':
        return '🇺🇸'
      case 'el':
        return '🇬🇷'
      default:
        return '🇺🇸'
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Simple Language Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 border border-white/20 hover:border-white/30 transition-all duration-200"
            title="Change Language"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{getFlag(currentLanguage)}</span>
              <Languages className="w-4 h-4" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-[#0c1b36] border border-white/20">
          <DropdownMenuItem
            onClick={() => switchLanguage('en')}
            className="cursor-pointer text-white hover:bg-white/10"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🇺🇸</span>
              <span>English</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => switchLanguage('el')}
            className="cursor-pointer text-white hover:bg-white/10"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🇬🇷</span>
              <span>Ελληνικά (Greek)</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Floating Language Switcher Component
export function FloatingLanguageSwitcher() {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'el'>('en')

  const switchLanguage = (language: 'en' | 'el') => {
    setCurrentLanguage(language)

    if (language === 'el') {
      // Use Google Translate URL to translate to Greek
      const currentUrl = window.location.href
      const translateUrl = `https://translate.google.com/translate?sl=en&tl=el&u=${encodeURIComponent(currentUrl)}`
      window.open(translateUrl, '_blank')
    } else {
      // For English, just reload the current page (or you could open in new tab)
      window.location.reload()
    }
  }

  const getFlag = (lang: 'en' | 'el') => {
    switch (lang) {
      case 'en':
        return '🇺🇸'
      case 'el':
        return '🇬🇷'
      default:
        return '🇺🇸'
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            title="Change Language"
          >
            <div className="flex items-center justify-center">
              <span className="text-xl">{getFlag(currentLanguage)}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="top"
          className="bg-[#0c1b36] border border-white/20 mb-2"
        >
          <DropdownMenuItem
            onClick={() => switchLanguage('en')}
            className="cursor-pointer text-white hover:bg-white/10"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🇺🇸</span>
              <span>English</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => switchLanguage('el')}
            className="cursor-pointer text-white hover:bg-white/10"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🇬🇷</span>
              <span>Ελληνικά (Greek)</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
