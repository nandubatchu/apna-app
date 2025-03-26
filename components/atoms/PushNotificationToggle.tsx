'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, BellOff } from 'lucide-react'

interface PushNotificationToggleProps {
  onSubscribe: () => Promise<void>
  onUnsubscribe: () => Promise<void>
}

export function PushNotificationToggle({
  onSubscribe,
  onUnsubscribe,
}: PushNotificationToggleProps) {
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    // Check if already subscribed on component mount
    const checkSubscriptionStatus = async () => {
      try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          return
        }

        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(!!subscription)
      } catch (error) {
        console.error('Error checking push subscription status:', error)
      }
    }

    checkSubscriptionStatus()
  }, [])

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      if (isSubscribed) {
        await onUnsubscribe()
      } else {
        await onSubscribe()
      }
      setIsSubscribed(!isSubscribed)
    } catch (error) {
      console.error('Error toggling push notification subscription:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={isLoading}
      variant={isSubscribed ? "outline" : "default"}
      className="flex items-center gap-2"
    >
      {isLoading ? (
        <span className="animate-spin">⏳</span>
      ) : isSubscribed ? (
        <>
          <BellOff className="h-4 w-4" />
          <span>Unsubscribe from Notifications</span>
        </>
      ) : (
        <>
          <Bell className="h-4 w-4" />
          <span>Subscribe to Notifications</span>
        </>
      )}
    </Button>
  )
}