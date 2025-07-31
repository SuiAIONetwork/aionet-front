"use client"

import { useRouter } from 'next/navigation'
import { ExternalLink, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfileLinkProps {
  address?: string
  username?: string
  children?: React.ReactNode
  className?: string
  showIcon?: boolean
  variant?: 'default' | 'subtle' | 'button'
  disabled?: boolean
}

export function ProfileLink({ 
  address, 
  username, 
  children, 
  className,
  showIcon = false,
  variant = 'default',
  disabled = false
}: ProfileLinkProps) {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (disabled) return

    // Prioritize username over address for better URLs
    let identifier = username || address
    if (identifier) {
      // Remove @ prefix from username if present (it gets added in community display)
      if (identifier.startsWith('@')) {
        identifier = identifier.slice(1)
      }
      router.push(`/profile/${encodeURIComponent(identifier)}`)
    }
  }

  if (!address && !username) {
    return <span className={className}>{children}</span>
  }

  const baseClasses = "inline-flex items-center gap-1 transition-colors"
  
  const variantClasses = {
    default: "text-blue-400 hover:text-blue-300 hover:underline cursor-pointer",
    subtle: "text-gray-300 hover:text-white cursor-pointer",
    button: "px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded cursor-pointer"
  }

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : ""

  return (
    <span
      onClick={handleClick}
      className={cn(
        baseClasses,
        variantClasses[variant],
        disabledClasses,
        className
      )}
      title={disabled ? undefined : `View ${username || address}'s profile`}
    >
      {children}
      {showIcon && !disabled && (
        <ExternalLink className="w-3 h-3 opacity-70" />
      )}
    </span>
  )
}

// Specialized component for displaying usernames with profile links
interface UsernameDisplayProps {
  address?: string
  username?: string
  fallback?: string
  className?: string
  showIcon?: boolean
  variant?: 'default' | 'subtle' | 'button'
}

export function UsernameDisplay({
  address,
  username,
  fallback = 'Unknown User',
  className,
  showIcon = false,
  variant = 'default'
}: UsernameDisplayProps) {
  const displayName = username || fallback

  return (
    <ProfileLink
      address={address}
      username={username}
      className={className}
      showIcon={showIcon}
      variant={variant}
    >
      {displayName}
    </ProfileLink>
  )
}

// Component for displaying address with profile link
interface AddressDisplayProps {
  address: string
  showFull?: boolean
  className?: string
  showIcon?: boolean
  variant?: 'default' | 'subtle' | 'button'
}

export function AddressDisplay({
  address,
  showFull = false,
  className,
  showIcon = false,
  variant = 'default'
}: AddressDisplayProps) {
  const displayAddress = showFull 
    ? address 
    : `${address.slice(0, 6)}...${address.slice(-4)}`

  return (
    <ProfileLink
      address={address}
      className={cn("font-mono text-sm", className)}
      showIcon={showIcon}
      variant={variant}
    >
      {displayAddress}
    </ProfileLink>
  )
}
