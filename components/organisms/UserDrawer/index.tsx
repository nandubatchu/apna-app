'use client'

import React, { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '../../ui/sheet'
import { Button } from '../../ui/button'
import { User, Settings, MessageSquare, Layout, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { getKeyPairFromLocalStorage } from '../../../lib/utils'
import nip98Config from '@/lib/nostr/nip98Config'
import { decode } from 'nostr-tools/nip19'

export default function UserDrawer() {
  const [keyPair, setKeyPair] = useState<{ npub: string; nsec: string } | null>(null)
  const [open, setOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const userKeyPair = getKeyPairFromLocalStorage()
    setKeyPair(userKeyPair)
    
    // Check if the user is an admin
    if (userKeyPair) {
      try {
        // Decode the npub to get the raw hex pubkey
        const decoded = decode(userKeyPair.npub)
        
        if (decoded.type === 'npub') {
          const pubkey = decoded.data as string
          const authorizedPubkeys = [
            ...nip98Config.authorizedPubkeys.pushSend,
            ...nip98Config.authorizedPubkeys.pushTest
          ]
          setIsAdmin(authorizedPubkeys.includes(pubkey))
        }
      } catch (error) {
        console.error('Error decoding npub:', error)
        setIsAdmin(false)
      }
    }
  }, [])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-[#e6efe9]">
          <User className="w-5 h-5 text-[#368564]" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px]">
        <div className="flex flex-col h-full">
          <div className="flex-1 py-4">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-[#368564]">
                {keyPair ? 'Account' : 'Sign In Required'}
              </h2>
              {!keyPair && (
                <p className="text-sm text-gray-500 mt-2">
                  Please import your Nsec key to access account features
                </p>
              )}
            </div>
            <nav className="space-y-2">
              <Link href="/my-apps" onClick={() => setOpen(false)}>
                <Button variant="ghost" className="w-full justify-start hover:bg-[#e6efe9]">
                  <Layout className="w-5 h-5 mr-2 text-[#368564]" />
                  <span className="text-gray-700">My Apps</span>
                </Button>
              </Link>
              <Link href="/settings" onClick={() => setOpen(false)}>
                <Button variant="ghost" className="w-full justify-start hover:bg-[#e6efe9]">
                  <Settings className="w-5 h-5 mr-2 text-[#368564]" />
                  <span className="text-gray-700">Settings</span>
                </Button>
              </Link>
              <Link href="/feedback" onClick={() => setOpen(false)}>
                <Button variant="ghost" className="w-full justify-start hover:bg-[#e6efe9]">
                  <MessageSquare className="w-5 h-5 mr-2 text-[#368564]" />
                  <span className="text-gray-700">Give Feedback</span>
                </Button>
              </Link>
              
              {isAdmin && (
                <Link href="/admin" onClick={() => setOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start hover:bg-[#e6efe9]">
                    <ShieldAlert className="w-5 h-5 mr-2 text-[#368564]" />
                    <span className="text-gray-700">Admin</span>
                  </Button>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}