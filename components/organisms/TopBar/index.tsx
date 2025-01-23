'use client'

import React, { useState, ChangeEvent } from 'react'
import { Button } from '../../../components/ui/button'
import { Star, ArrowLeft } from 'lucide-react'
import UserDrawer from '../UserDrawer'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '../../../components/ui/dialog'
import { getKeyPairFromLocalStorage } from '../../../lib/utils'
import { ReactToNote } from '../../../lib/nostr'
import { usePathname, useRouter } from 'next/navigation'

interface TopBarProps {
  appId?: string;
  appName?: string;
  onRate?: () => void;
  onClose?: () => void;
  showBackButton?: boolean;
}

export default function TopBar(props: TopBarProps = {}) {
  const { appId, appName, onRate, onClose, showBackButton } = props
  const pathname = usePathname()
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const getPageTitle = () => {
    if (appName) return appName
    
    switch (pathname) {
      case '/':
        return 'Apna'
      case '/explore':
        return 'Explore Apps'
      case '/settings':
        return 'User Settings'
      default:
        return ''
    }
  }

  const handleBackClick = () => {
    if (onClose) {
      onClose()
    } else {
      router.back()
    }
  }

  const handleRate = async () => {
    if (!appId || !onRate) return

    const existingKeyPair = getKeyPairFromLocalStorage()
    if (!existingKeyPair) return

    const ratingData = JSON.stringify({
      rating,
      feedback
    })

    await ReactToNote(appId, existingKeyPair.nsec, ratingData)
    onRate()
    setIsOpen(false)
  }

  const handleFeedbackChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setFeedback(e.target.value)
  }

  const renderAppControls = () => {
    if (!appId) return null;

    return (
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
    )
  }

  const displayBackButton = showBackButton || pathname === '/settings'

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center">
      <div className="flex items-center gap-3">
        {displayBackButton ? (
          <Button 
            variant="ghost" 
            size="icon"
            className="hover:bg-[#e6efe9]"
            onClick={handleBackClick}
          >
            <ArrowLeft className="w-5 h-5 text-[#368564]" />
          </Button>
        ) : (
          <UserDrawer />
        )}
        <h1 className="text-lg font-semibold text-[#368564]">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center">
        {renderAppControls()}
      </div>
    </div>
  )
}