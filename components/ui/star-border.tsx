"use client"

import { ElementType, ReactNode } from "react"
import "./star-border.css"
import { cn } from "@/lib/utils"

interface StarBorderProps {
  as?: ElementType
  className?: string
  color?: string
  speed?: string
  children: ReactNode
  [key: string]: any
}

const StarBorder = ({
  as: Component = "div",
  className = "",
  color = "white",
  speed = "6s",
  children,
  ...rest
}: StarBorderProps) => {
  return (
    <Component className={cn("star-border-container", className)} {...rest}>
      <div
        className="border-gradient-bottom"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 30%)`,
          animationDuration: speed,
        }}
      ></div>
      <div
        className="border-gradient-top"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 30%)`,
          animationDuration: speed,
        }}
      ></div>
      <div className="inner-content">{children}</div>
    </Component>
  );
};

export default StarBorder;
