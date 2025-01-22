'use client'
import React, { useState, ChangeEvent } from 'react'
import { Button } from '../../../components/ui/button'
import { Star, ArrowLeft } from 'lucide-react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '../../../components/ui/dialog'
import { getKeyPairFromLocalStorage } from '../../../lib/utils'
import { ReactToNote } from '../../../lib/nostr'

interface TopBarProps {
  appId: string;
  appName?: string;
  onRate?: () => void;
  onClose?: () => void;
  showBackButton?: boolean;
}

export default function TopBar({ appId, appName, onRate, onClose, showBackButton }: TopBarProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const handleRate = async () => {
    const existingKeyPair = getKeyPairFromLocalStorage()
    if (!existingKeyPair) return

    const ratingData = JSON.stringify({
      rating,
      feedback
    })

    await ReactToNote(appId, existingKeyPair.nsec, ratingData)
    if (onRate) onRate()
    setIsOpen(false)
  }

  const handleFeedbackChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setFeedback(e.target.value)
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <Button 
            variant="ghost" 
            size="icon"
            className="hover:bg-[#e6efe9]"
            onClick={onClose}
          >
            <ArrowLeft className="w-5 h-5 text-[#368564]" />
          </Button>
        )}
        {appName && (
          <h1 className="text-lg font-semibold text-[#368564]">
            {appName}
          </h1>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="hover:bg-[#e6efe9]">
            <Star className="w-5 h-5 text-[#368564] mr-2" />
            Rate App
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate this App</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center space-x-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Button
                key={star}
                variant="ghost"
                size="sm"
                className="p-1 hover:bg-[#e6efe9]"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className="w-8 h-8"
                  fill={(hoveredRating || rating) >= star ? "#368564" : "none"}
                  color="#368564"
                />
              </Button>
            ))}
          </div>
          <textarea
            placeholder="Share your feedback about this app (optional)"
            value={feedback}
            onChange={handleFeedbackChange}
            className="w-full min-h-[100px] p-2 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-[#368564]"
          />
          <Button
            onClick={handleRate}
            disabled={rating === 0}
            className="w-full bg-[#368564] hover:bg-[#2c6b51] text-white"
          >
            Submit Rating
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}