/**
 * pAION Token Icon Component
 * Uses the official logo-icon.png for pAION token display
 */

import React from 'react'

interface PaionIconProps {
  size?: 'sm' | 'md' | 'lg' | number
  className?: string
}

export function PaionIcon({ size = 'md', className = '' }: PaionIconProps) {
  // Size mapping
  const sizeMap = {
    sm: 20,
    md: 24,
    lg: 32
  }

  const iconSize = typeof size === 'number' ? size : sizeMap[size]

  return (
    <img
      src="/images/logo-icon.png"
      alt="pAION"
      className={`object-contain ${className}`}
      style={{ width: iconSize, height: iconSize }}
    />
  )
}

// Alternative SVG-based icon (more scalable)
export function PaionIconSVG({ size = 'md', className = '' }: PaionIconProps) {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32
  }
  
  const iconSize = typeof size === 'number' ? size : sizeMap[size]
  
  return (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="paion-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4DA2FF" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="12" fill="url(#paion-gradient)" />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fill="white"
        fontSize="12"
        fontWeight="bold"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        P
      </text>
    </svg>
  )
}

// Export default as the simple div-based icon
export default PaionIcon
