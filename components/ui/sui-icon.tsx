import React from 'react'
import Image from 'next/image'

interface SuiIconProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function SuiIcon({ className = '', size = 'md' }: SuiIconProps) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10'
  }

  return (
    <Image
      src="/images/logo-sui.png"
      alt="SUI"
      width={size === 'sm' ? 20 : size === 'md' ? 24 : size === 'lg' ? 32 : 40}
      height={size === 'sm' ? 20 : size === 'md' ? 24 : size === 'lg' ? 32 : 40}
      className={`${sizeClasses[size]} ${className} object-contain`}
    />
  )
}
