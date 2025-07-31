"use client"

import { useState, useEffect, useRef } from 'react'
import { Search, User, ExternalLink, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface SearchResult {
  address: string
  username: string
  profileImageUrl: string | null
  roleTier: 'NOMAD' | 'PRO' | 'ROYAL'
  profileLevel: number
  isVerified: boolean
}

export function UserSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query.trim())
      } else {
        setResults([])
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const performSearch = async (searchQuery: string) => {
    setIsSearching(true)
    try {
      // For now, we'll search by trying to fetch the profile directly
      // In a real implementation, you'd have a dedicated search API
      const response = await fetch(`/api/profile/${encodeURIComponent(searchQuery)}`)
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setResults([result.data])
          setShowResults(true)
        } else {
          setResults([])
          setShowResults(false)
        }
      } else {
        setResults([])
        setShowResults(false)
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
      setShowResults(false)
    } finally {
      setIsSearching(false)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    // Prioritize username over address for better URLs
    const identifier = result.username || result.address
    router.push(`/profile/${encodeURIComponent(identifier)}`)
    setShowResults(false)
    setQuery('')
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'ROYAL': return 'text-purple-400'
      case 'PRO': return 'text-blue-400'
      case 'NOMAD': return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'ROYAL': return '👑'
      case 'PRO': return '⭐'
      case 'NOMAD': return '🌟'
      default: return '👤'
    }
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search users by username or address..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowResults(true)
          }}
          className="pl-10 pr-10 bg-[#1a2f51] border-[#C0E6FF]/30 text-white placeholder-gray-400 focus:border-[#4DA2FF]"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0c1b36] border border-[#1e3a8a] rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => handleResultClick(result)}
              className="w-full p-4 hover:bg-[#1a2f51] transition-colors text-left border-b border-[#1e3a8a] last:border-b-0"
            >
              <div className="flex items-center gap-3">
                {/* Profile Image */}
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex-shrink-0">
                  {result.profileImageUrl ? (
                    <img
                      src={result.profileImageUrl}
                      alt={result.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium truncate">
                      {result.username}
                    </span>
                    <span className={`text-xs ${getTierColor(result.roleTier)}`}>
                      {getTierIcon(result.roleTier)} {result.roleTier}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>Level {result.profileLevel}</span>
                    {result.isVerified && (
                      <span className="text-green-400">✓ Verified</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 font-mono truncate">
                    {result.address.slice(0, 8)}...{result.address.slice(-6)}
                  </div>
                </div>

                {/* View Profile Icon */}
                <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {showResults && results.length === 0 && !isSearching && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0c1b36] border border-[#1e3a8a] rounded-lg shadow-xl z-50 p-4 text-center text-gray-400">
          No users found matching "{query}"
        </div>
      )}
    </div>
  )
}
