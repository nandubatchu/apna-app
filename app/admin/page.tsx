'use client'

import { useState, useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { PushNotificationAdmin } from "@/components/molecules/PushNotificationAdmin"
import { useProfile } from "@/lib/hooks/useProfile"
import { getKeyPairFromLocalStorage } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import nip98Config from "@/lib/nostr/nip98Config"
import { decode } from "nostr-tools/nip19"

// List of authorized pubkeys that can access the admin page
const AUTHORIZED_PUBKEYS = [
  ...nip98Config.authorizedPubkeys.pushSend,
  ...nip98Config.authorizedPubkeys.pushTest
]

export default function AdminPage() {
  const { profile } = useProfile()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false)
  const [keyPair, setKeyPair] = useState<{ npub: string; nsec: string } | null>(null)
  
  useEffect(() => {
    // Get the user's keypair
    const userKeyPair = getKeyPairFromLocalStorage()
    setKeyPair(userKeyPair)
    
    // Check if the user is authorized to access this page
    if (userKeyPair) {
      try {
        // Decode the npub to get the raw hex pubkey
        const decoded = decode(userKeyPair.npub)
        let pubkey = ''
        
        if (decoded.type === 'npub') {
          pubkey = decoded.data as string
          
          // Check if the user's pubkey is in the authorized list
          const isUserAuthorized = AUTHORIZED_PUBKEYS.includes(pubkey)
          setIsAuthorized(isUserAuthorized)
          
          // If not authorized, redirect to the home page
          if (!isUserAuthorized) {
            router.push('/')
          }
        } else {
          // Invalid npub format
          router.push('/')
        }
      } catch (error) {
        console.error('Error decoding npub:', error)
        router.push('/')
      }
    } else {
      // No keypair, redirect to the home page
      router.push('/')
    }
  }, [router])

  if (!profile || !isAuthorized) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Unauthorized</AlertTitle>
          <AlertDescription>
            You do not have permission to access this page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <div className="space-y-6">
        <section className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Admin Settings</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  This section is for administrators only. You need a valid Nostr key with NIP-98
                  authentication to use these features. All actions are authenticated and logged.
                </p>
              </div>
            </div>
            
            <div className="pt-4">
              <PushNotificationAdmin nsecOrNpub={keyPair?.nsec || ''} />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}