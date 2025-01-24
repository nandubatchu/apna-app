"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Expand } from "lucide-react"
import Image from "next/image"
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion"
import { useEffect, useRef, useState } from "react"

const MotionDiv = motion.div
const FAB_SIZE = 48 // Reduced size by ~15%

interface FabProps {
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}

export function Fab({ onToggleFullscreen, isFullscreen }: FabProps) {
  const fabRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const [constraints, setConstraints] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  })
  
  // Spring animation for snapping to sides
  const springX = useSpring(x, { damping: 20 })
  const springY = useSpring(y, { damping: 20 })

  useEffect(() => {
    const updateConstraints = () => {
      if (typeof window !== 'undefined') {
        setConstraints({
          top: 64, // Below top bar
          bottom: window.innerHeight - FAB_SIZE,
          left: 0,
          right: window.innerWidth - FAB_SIZE
        })
      }
    }

    const updatePosition = () => {
      if (fabRef.current) {
        // Start at top right
        x.set(window.innerWidth - FAB_SIZE - 16)
        y.set(64)
      }
    }

    updateConstraints()
    updatePosition()
    window.addEventListener('resize', () => {
      updateConstraints()
      updatePosition()
    })
    return () => window.removeEventListener('resize', updateConstraints)
  }, [x, y])

  const onDragEnd = () => {
    if (fabRef.current) {
      const currentX = x.get()
      const windowWidth = window.innerWidth
      const currentY = y.get()
      
      // Snap to nearest side with 16px padding
      if (currentX < windowWidth / 2) {
        x.set(16) // Snap to left with padding
      } else {
        x.set(windowWidth - FAB_SIZE - 16) // Snap to right with padding
      }

      // Ensure y position stays within bounds
      const minY = constraints.top
      const maxY = constraints.bottom
      if (currentY < minY) y.set(minY)
      if (currentY > maxY) y.set(maxY)
    }
  }

  return (
    <MotionDiv 
      ref={fabRef}
      drag
      dragMomentum={false}
      dragElastic={0.1}
      dragConstraints={constraints}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        x: springX,
        y: springY,
        touchAction: 'none',
      }}
      onDragEnd={onDragEnd}
      className="z-[100] pointer-events-auto"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="default"
            size="icon"
            className="relative rounded-full shadow-lg p-0 overflow-hidden h-12 w-12" // h-12/w-12 is 48px
          >
            <Image
              src="/icon-192x192.png"
              alt="App Logo"
              fill
              className="object-cover"
              sizes="48px"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="z-[100]"
          sideOffset={8}
          alignOffset={-8}
        >
          <DropdownMenuItem onClick={onToggleFullscreen}>
            <Expand className="mr-2 h-4 w-4" />
            {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </MotionDiv>
  )
}