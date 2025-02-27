"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { getKeyPairFromLocalStorage, getUserProfileByNpub } from "@/lib/utils"
import { User, KeyRound } from "lucide-react"
import ProfileManager from "@/components/organisms/ProfileManager"

export default function ImportNsecApp() {
  const [isProfileManagerOpen, setIsProfileManagerOpen] = useState(false)
  const [activeProfile, setActiveProfile] = useState<{
    npub: string;
    alias?: string;
  } | null>(null)

  // Load active profile on mount
  const loadActiveProfile = () => {
    const keyPair = getKeyPairFromLocalStorage()
    if (keyPair && keyPair.npub) {
      const profile = getUserProfileByNpub(keyPair.npub)
      setActiveProfile({
        npub: keyPair.npub,
        alias: profile?.alias
      })
    } else {
      setActiveProfile(null)
    }
  }

  // Get active profile on mount and when it changes
  useEffect(() => {
    loadActiveProfile()
  }, [])

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <h3 className="text-md font-medium">Active Profile</h3>
          
          {activeProfile ? (
            <div className="flex flex-col p-4 rounded-lg border border-[#368564] bg-[#e6efe9]">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-[#368564]" />
                {activeProfile.alias ? (
                  <span className="text-sm font-medium">
                    {activeProfile.alias}
                  </span>
                ) : (
                  <span className="text-sm font-medium">
                    Unnamed Profile
                  </span>
                )}
                <span className="text-xs bg-[#368564] text-white px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>
              
              <div className="mb-4">
                <div className="text-xs text-gray-600 mb-1">Public Key:</div>
                <div className="font-mono text-sm break-all bg-white p-2 rounded border border-gray-200">
                  {activeProfile.npub}
                </div>
              </div>
              
              <Button
                className="bg-white hover:bg-[#e6efe9] shadow-sm hover:shadow-md transition-all duration-300 text-[#368564] hover:text-[#2a684d] border border-[#368564] hover:border-[#2a684d]"
                onClick={() => setIsProfileManagerOpen(true)}
              >
                <span className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5" />
                  Manage Profiles
                </span>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col p-4 rounded-lg border border-gray-200">
              <div className="text-gray-500 text-sm mb-4">No active profile found</div>
              <Button
                className="bg-white hover:bg-[#e6efe9] shadow-sm hover:shadow-md transition-all duration-300 text-[#368564] hover:text-[#2a684d] border border-[#368564] hover:border-[#2a684d]"
                onClick={() => setIsProfileManagerOpen(true)}
              >
                <span className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5" />
                  Manage Profiles
                </span>
              </Button>
            </div>
          )}
        </div>
      </div>

      <ProfileManager 
        open={isProfileManagerOpen} 
        onOpenChange={setIsProfileManagerOpen}
        onProfileChange={loadActiveProfile}
      />
    </>
  )
}
