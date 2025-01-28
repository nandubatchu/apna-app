"use client"

import { useEffect, useState } from "react"
import { AppCard } from "@/components/molecules/AppCard"
import EditApp from "@/components/organisms/EditApp"
import { useApps } from "@/lib/hooks/useApps"
import { useProfile } from "@/lib/hooks/useProfile"
import { getKeyPairFromLocalStorage } from "@/lib/utils"
import BottomNav from "@/components/organisms/BottomNav"
import { Button } from "@/components/ui/button"
import { nip19 } from 'nostr-tools'
import type { AppDetails } from "@/lib/types/apps"

export default function MyAppsPage() {
  const { apps, loading, error, refetch } = useApps()
  const { loading: profileLoading } = useProfile()
  const [keyPair, setKeyPair] = useState<{ npub: string; nsec: string } | null>(null)
  const [selectedApp, setSelectedApp] = useState<AppDetails | null>(null)

  useEffect(() => {
    const kp = getKeyPairFromLocalStorage()
    if (kp) {
      setKeyPair(kp)
    }
  }, [])

  // Filter apps to show only those published by the current user
  const myApps = apps.filter(app => {
    if (!keyPair?.npub) return false;
    try {
      // Convert npub to hex pubkey for comparison
      const { data: pubkey } = nip19.decode(keyPair.npub);
      return app.pubkey === (pubkey as string);
    } catch {
      return false;
    }
  })

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center flex-1 h-[calc(100vh-56px)]">
        <p className="text-gray-600">Loading your apps...</p>
      </div>
    );
  }

  if (!keyPair) {
    return (
      <div className="flex items-center justify-center flex-1 h-[calc(100vh-56px)]">
        <p className="text-gray-600">Please sign in to view your apps</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 h-[calc(100vh-56px)]">
        <p className="text-red-600">Failed to load apps</p>
        <Button
          onClick={() => refetch(true)}
          className="mt-4 px-4 py-2 bg-[#368564] text-white rounded-md hover:bg-[#2a6b4f]"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 pb-20">
        <div className="flex flex-col space-y-3">
          {myApps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              selected={false}
              showEditButton
              onSelect={() => setSelectedApp(app)}
            />
          ))}
        </div>
        {myApps.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            You haven&apos;t published any apps yet
          </div>
        )}
      </div>
      {selectedApp && (
        <EditApp
          app={selectedApp}
          onSuccess={() => {
            setSelectedApp(null);
            refetch(true);
          }}
        />
      )}
      <BottomNav />
    </>
  )
}