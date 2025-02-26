"use client"

import React, { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { GetNpubProfileMetadata } from "@/lib/nostr"
import {
  getAllUserProfilesFromLocalStorage,
  getKeyPairFromLocalStorage,
  addUserProfileToLocalStorage,
  removeUserProfileFromLocalStorage,
  setActiveUserProfile,
  getUserProfileByNpub,
  saveProfileToLocalStorage,
  profileExistsWithNsec,
  IUserKeyPair
} from "@/lib/utils"
import { getPublicKey, nip19 } from "nostr-tools"
// Removed unused import

const formSchema = z.object({
  nsec: z.string().startsWith("nsec", {
    message: `Nsec is invalid! Should start with "nsec"`,
  }),
  alias: z.string().optional()
})

export default function ImportNsecApp() {
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [exportNpub, setExportNpub] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<IUserKeyPair[]>([])
  const [activeNpub, setActiveNpub] = useState<string | null>(null)
  const [confirmRemoveNpub, setConfirmRemoveNpub] = useState<string | null>(null)
  const [duplicateProfile, setDuplicateProfile] = useState<IUserKeyPair | null>(null)
  const [pendingImport, setPendingImport] = useState<{nsec: string, npub: string, alias?: string} | null>(null)

  // Load profiles on mount and when they change
  const loadProfiles = () => {
    const allProfiles = getAllUserProfilesFromLocalStorage()
    setProfiles(allProfiles)
    
    const keyPair = getKeyPairFromLocalStorage()
    if (keyPair && keyPair.npub) {
      setActiveNpub(keyPair.npub)
    }
  }

  // Get profiles on mount
  useEffect(() => {
    loadProfiles()
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nsec: "",
      alias: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const nsec = values.nsec
      const alias = values.alias
      const decodedNsec = nip19.decode(nsec)
      if (!decodedNsec || !decodedNsec.data) {
        throw new Error("Invalid nsec key")
      }
      
      const npub = nip19.npubEncode(getPublicKey(decodedNsec.data as Uint8Array))
      
      // Check if this nsec already exists
      const existingProfile = profileExistsWithNsec(nsec)
      if (existingProfile) {
        setDuplicateProfile(existingProfile)
        setPendingImport({ nsec, npub, alias })
        return
      }
      
      // Proceed with import
      await completeImport(nsec, npub, alias)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import nsec key")
    }
  }
  
  async function completeImport(nsec: string, npub: string, alias?: string) {
    try {
      const profile = {
        metadata: await GetNpubProfileMetadata(npub)
      }
      
      // Add to profiles instead of replacing
      addUserProfileToLocalStorage(npub, nsec, true, alias)
      saveProfileToLocalStorage(profile)
      
      // Update UI
      loadProfiles()
      form.reset()
      setIsImportOpen(false)
      setPendingImport(null)
      setDuplicateProfile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import nsec key")
    }
  }

  function handleSwitchProfile(npub: string) {
    setActiveUserProfile(npub)
    loadProfiles()
  }

  function handleRemoveProfile(npub: string) {
    setConfirmRemoveNpub(npub)
  }

  function confirmRemoveProfile() {
    if (confirmRemoveNpub) {
      removeUserProfileFromLocalStorage(confirmRemoveNpub)
      loadProfiles()
      setConfirmRemoveNpub(null)
    }
  }

  function handleExportProfile(npub: string) {
    setExportNpub(npub)
    setIsExportOpen(true)
  }

  return (
    <>
      {/* Error Dialog */}
      <Dialog open={!!error} onOpenChange={() => setError(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-500">Error</DialogTitle>
          </DialogHeader>
          <div className="text-gray-700 mt-2">{error}</div>
          <Button
            onClick={() => setError(null)}
            className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Remove Dialog */}
      <Dialog open={!!confirmRemoveNpub} onOpenChange={() => setConfirmRemoveNpub(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Remove Profile</DialogTitle>
            <div className="text-sm text-gray-500 mt-1">
              Are you sure you want to remove this profile? This action cannot be undone.
            </div>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 px-4 py-2"
              onClick={() => setConfirmRemoveNpub(null)}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2"
              onClick={confirmRemoveProfile}
            >
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Duplicate Profile Dialog */}
      <Dialog open={!!duplicateProfile} onOpenChange={() => setDuplicateProfile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Profile</DialogTitle>
            <div className="text-sm text-gray-500 mt-1">
              This nsec key already exists for profile:
              <span className="font-mono ml-1">
                {duplicateProfile?.npub?.slice(0, 8)}...{duplicateProfile?.npub?.slice(-8)}
              </span>
              {duplicateProfile?.alias && <span className="ml-1">({duplicateProfile.alias})</span>}
            </div>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 px-4 py-2"
              onClick={() => {
                setDuplicateProfile(null);
                setPendingImport(null);
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#368564] hover:bg-[#2a684d] text-white px-4 py-2"
              onClick={() => {
                if (pendingImport) {
                  completeImport(pendingImport.nsec, pendingImport.npub, pendingImport.alias);
                }
              }}
            >
              Update Profile
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Export Profile Dialog */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Private Key</DialogTitle>
            <div className="text-sm text-gray-500 mt-1">
              This is your private key. Never share it with anyone!
            </div>
          </DialogHeader>
          <div className="bg-gray-100 p-3 rounded-md overflow-x-auto">
            <code className="text-sm break-all">
              {exportNpub && getUserProfileByNpub(exportNpub)?.nsec}
            </code>
          </div>
          <div className="flex justify-end mt-4">
            <Button
              className="bg-[#368564] hover:bg-[#2a684d] text-white px-4 py-2"
              onClick={() => setIsExportOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <h3 className="text-md font-medium">User Profiles</h3>
          
          {profiles.length > 0 ? (
            <div className="space-y-4">
              {profiles.map((profile) => (
                <div
                  key={profile.npub}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    profile.npub === activeNpub
                      ? 'border-[#368564] bg-[#e6efe9]'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {profile.npub.slice(0, 8)}...{profile.npub.slice(-8)}
                    </span>
                    {profile.alias && (
                      <span className="text-xs text-gray-600">
                        ({profile.alias})
                      </span>
                    )}
                    {profile.npub === activeNpub && (
                      <span className="text-xs bg-[#368564] text-white px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {profile.npub !== activeNpub && (
                      <Button
                        className="py-1 px-2 text-sm border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                        onClick={() => handleSwitchProfile(profile.npub)}
                      >
                        Switch
                      </Button>
                    )}
                    <Button
                      className="py-1 px-2 text-sm border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                      onClick={() => handleExportProfile(profile.npub)}
                    >
                      Export
                    </Button>
                    {profiles.length > 1 && (
                      <Button
                        className="py-1 px-2 text-sm bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => handleRemoveProfile(profile.npub)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">No profiles found</div>
          )}
        </div>
        
        <Drawer open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DrawerTrigger asChild>
            <Button
              className="bg-white hover:bg-[#e6efe9] shadow-sm hover:shadow-md transition-all duration-300 text-[#368564] hover:text-[#2a684d] border border-[#368564] hover:border-[#2a684d]"
              onClick={() => setIsImportOpen(true)}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Import New Profile
              </span>
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="mx-auto w-full max-w-lg">
              <DrawerHeader className="border-b border-gray-100 pb-4 px-4 sm:px-6">
                <DrawerTitle className="text-xl sm:text-2xl font-semibold text-[#368564]">
                  Import New Profile
                </DrawerTitle>
                <DrawerDescription className="text-gray-600 text-sm sm:text-base">
                  Add a new profile using your nsec key
                </DrawerDescription>
              </DrawerHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 sm:p-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="nsec"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Nsec Key</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                placeholder="Enter your nsec"
                                {...field}
                                className="border-gray-200 focus:border-[#368564] focus:ring-[#e6efe9] pl-10"
                              />
                              <svg
                                className="w-5 h-5 text-[#368564] absolute left-3 top-1/2 transform -translate-y-1/2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="alias"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Alias (Optional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                placeholder="Enter a name for this profile"
                                {...field}
                                className="border-gray-200 focus:border-[#368564] focus:ring-[#e6efe9] pl-10"
                              />
                              <svg
                                className="w-5 h-5 text-[#368564] absolute left-3 top-1/2 transform -translate-y-1/2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#368564] hover:bg-[#2a684d] text-white font-semibold py-2 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    Import Key
                  </Button>
                </form>
              </Form>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  )
}
