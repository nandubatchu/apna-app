'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { addNip98AuthToFetchOptions } from '@/lib/nostr/nip98Client'

interface PushNotificationAdminProps {
  nsecOrNpub: string
}

/**
 * Admin component for sending push notifications
 * Uses NIP-98 authentication to access protected endpoints
 */
export function PushNotificationAdmin({ nsecOrNpub }: PushNotificationAdminProps) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'info' | null
    message: string
  }>({ type: null, message: '' })
  const [loading, setLoading] = useState(false)

  const sendTestNotification = async () => {
    try {
      setLoading(true)
      setStatus({ type: 'info', message: 'Sending test notification...' })

      // Create the URL for the test endpoint
      const url = `${window.location.origin}/api/push/test`

      // Add NIP-98 authentication to the fetch options
      const options = await addNip98AuthToFetchOptions(nsecOrNpub, url)

      // Make the authenticated request
      const response = await fetch(url, options)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test notification')
      }

      setStatus({
        type: 'success',
        message: data.message || 'Test notification sent successfully'
      })
    } catch (error) {
      console.error('Error sending test notification:', error)
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const sendNotification = async () => {
    if (!title || !message) {
      setStatus({
        type: 'error',
        message: 'Title and message are required'
      })
      return
    }

    try {
      setLoading(true)
      setStatus({ type: 'info', message: 'Sending notification...' })

      // Create the URL for the send endpoint
      const url = `${window.location.origin}/api/push/send`

      // Prepare the request body
      const body = { title, message }

      // Add NIP-98 authentication to the fetch options
      const options = await addNip98AuthToFetchOptions(nsecOrNpub, url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      // Make the authenticated request
      const response = await fetch(url, options)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send notification')
      }

      setStatus({
        type: 'success',
        message: data.message || 'Notification sent successfully'
      })
      
      // Clear the form
      setTitle('')
      setMessage('')
    } catch (error) {
      console.error('Error sending notification:', error)
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Push Notification Admin</h2>
        <p className="text-muted-foreground">
          Send push notifications to all subscribers using NIP-98 authentication
        </p>
      </div>

      {status.type && (
        <Alert variant={status.type === 'error' ? 'destructive' : 'default'}>
          <AlertTitle>
            {status.type === 'success' ? 'Success' : 
             status.type === 'error' ? 'Error' : 'Info'}
          </AlertTitle>
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="title">Notification Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter notification title"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="message">Notification Message</Label>
          <Input
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter notification message"
          />
        </div>

        <div className="flex gap-4">
          <Button
            onClick={sendNotification}
            disabled={loading || !title || !message}
          >
            {loading ? 'Sending...' : 'Send Notification'}
          </Button>
          
          <Button
            variant="outline"
            onClick={sendTestNotification}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Test Notification'}
          </Button>
        </div>
      </div>
    </div>
  )
}