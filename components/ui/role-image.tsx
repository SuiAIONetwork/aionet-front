"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface RoleImageProps {
  role: "NOMAD" | "PRO" | "ROYAL"
  size?: "sm" | "md" | "lg" | "xl" | "2xl"
  className?: string
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
  "2xl": "w-16 h-16"
}

const roleImages = {
  NOMAD: "/images/nomad.png",
  PRO: "/images/pro.png",
  ROYAL: "/images/royal.png"
}

export function RoleImage({ role, size = "md", className }: RoleImageProps) {
  return (
    <Image
      src={roleImages[role]}
      alt={`${role} role`}
      width={size === "sm" ? 16 : size === "md" ? 24 : size === "lg" ? 32 : size === "xl" ? 48 : 64}
      height={size === "sm" ? 16 : size === "md" ? 24 : size === "lg" ? 32 : size === "xl" ? 48 : 64}
      className={cn(sizeClasses[size], "object-contain", className)}
    />
  )
}
