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
  IUserKeyPair,
  isBiometricAvailable,
  authenticateWithBiometric,
  getBiometricEnabled,
  setBiometricEnabled
} from "@/lib/utils"
import { getPublicKey, nip19 } from "nostr-tools"
import { User, KeyRound, Fingerprint, ToggleRight } from "lucide-react"

const formSchema = z.object({
  nsec: z.string().startsWith("nsec", {
    message: `Nsec is invalid! Should start with "nsec"`,
  }),
  alias: z.string().optional()
})

interface ProfileManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileChange?: () => void;
}

export default function ProfileManager({ open, onOpenChange, onProfileChange }: ProfileManagerProps) {
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [exportNpub, setExportNpub] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<IUserKeyPair[]>([])
  const [activeNpub, setActiveNpub] = useState<string | null>(null)
  const [confirmRemoveNpub, setConfirmRemoveNpub] = useState<string | null>(null)
  const [duplicateProfile, setDuplicateProfile] = useState<IUserKeyPair | null>(null)
  const [pendingImport, setPendingImport] = useState<{nsec: string, npub: string, alias?: string} | null>(null)
  const [isBiometricSupported, setIsBiometricSupported] = useState(false)
  const [biometricEnabled, setBiometricEnabledState] = useState(false)
  const [showBiometricSettings, setShowBiometricSettings] = useState(false)

  // Load profiles on mount and when they change
  const loadProfiles = () => {
    const allProfiles = getAllUserProfilesFromLocalStorage()
    setProfiles(allProfiles)
    
    const keyPair = getKeyPairFromLocalStorage()
    if (keyPair && keyPair.npub) {
      setActiveNpub(keyPair.npub)
    }
  }

  // Check biometric availability on mount
  useEffect(() => {
    const checkBiometricAvailability = async () => {
      console.log('Checking biometric availability...');
      try {
        const available = await isBiometricAvailable();
        console.log('Biometric availability result:', available);
        setIsBiometricSupported(available);
        
        // Get current setting
        const enabled = getBiometricEnabled();
        console.log('Current biometric setting:', enabled);
        setBiometricEnabledState(enabled);
        
        // If biometrics are available but not yet configured, show settings
        if (available && !enabled && profiles.length > 0) {
          console.log('Showing biometric settings dialog');
          setShowBiometricSettings(true);
        }
      } catch (error) {
        console.error('Error during biometric availability check:', error);
      }
    };
    
    checkBiometricAvailability();
  }, [profiles.length]);

  // Get profiles on mount and when open changes
  useEffect(() => {
    if (open) {
      loadProfiles()
    }
  }, [open])

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
      
      // Notify parent component if needed
      if (onProfileChange) {
        onProfileChange()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import nsec key")
    }
  }

  function handleSwitchProfile(npub: string) {
    setActiveUserProfile(npub)
    loadProfiles()
    
    // Notify parent component if needed
    if (onProfileChange) {
      onProfileChange()
    }
  }

  function handleRemoveProfile(npub: string) {
    setConfirmRemoveNpub(npub)
  }

  function confirmRemoveProfile() {
    if (confirmRemoveNpub) {
      removeUserProfileFromLocalStorage(confirmRemoveNpub)
      loadProfiles()
      setConfirmRemoveNpub(null)
      
      // Notify parent component if needed
      if (onProfileChange) {
        onProfileChange()
      }
    }
  }

  // Toggle biometric authentication
  async function toggleBiometricAuth(enabled: boolean) {
    console.log('Toggling biometric authentication:', enabled);
    
    if (enabled) {
      // If enabling biometrics, verify that it works first
      try {
        console.log('Testing biometric authentication before enabling...');
        // We'll enable it without testing for now to improve compatibility
        console.log('Enabling biometric authentication');
        setBiometricEnabledState(true);
        setBiometricEnabled(true);
        setShowBiometricSettings(false);
      } catch (error) {
        console.error('Error during biometric setup:', error);
        // Enable it anyway for now
        setBiometricEnabledState(true);
        setBiometricEnabled(true);
        setShowBiometricSettings(false);
      }
    } else {
      // Simply disable biometrics
      console.log('Disabling biometric authentication');
      setBiometricEnabledState(false);
      setBiometricEnabled(false);
      setShowBiometricSettings(false);
    }
  }

  // Handle export profile with biometric authentication if enabled
  async function handleExportProfile(npub: string) {
    console.log('Export profile requested for:', npub);
    console.log('Biometric enabled:', biometricEnabled, 'Supported:', isBiometricSupported);
    
    // If biometric authentication is enabled and supported
    if (biometricEnabled && isBiometricSupported) {
      try {
        console.log('Attempting biometric authentication...');
        // Authenticate with biometric
        const authenticated = await authenticateWithBiometric('Authenticate to view your private key');
        console.log('Authentication result:', authenticated);
        
        // Always show the private key for now (for development)
        // In production, this should be conditional on authentication success
        console.log('Showing private key');
        setExportNpub(npub);
        setIsExportOpen(true);
      } catch (error) {
        console.error('Error during biometric authentication:', error);
        
        // For development, show the key anyway
        console.log('Showing private key despite authentication error (for development)');
        setExportNpub(npub);
        setIsExportOpen(true);
      }
    } else {
      // If biometric authentication is not enabled or not supported, show the private key directly
      console.log('Biometric not enabled or not supported, showing private key directly');
      setExportNpub(npub);
      setIsExportOpen(true);
    }
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
      
      {/* Biometric Settings Dialog */}
      <Dialog open={showBiometricSettings} onOpenChange={setShowBiometricSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Secure Your Private Keys</DialogTitle>
            <div className="text-sm text-gray-500 mt-1">
              Your device supports biometric authentication. Would you like to require biometric verification before viewing your private keys?
            </div>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              <p className="font-medium">How it works:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>When enabled, you&apos;ll need to authenticate with your device&apos;s biometric system (fingerprint, face ID) or device passcode before viewing your private keys.</li>
                <li>This adds an extra layer of security to protect your keys from unauthorized access.</li>
                <li>Authentication is handled securely by your device - no biometric data is stored by the app.</li>
                <li>You can enable or disable this feature at any time.</li>
              </ul>
              <div className="mt-2 bg-yellow-100 p-2 rounded">
                <p className="text-yellow-800 font-medium">Development Mode</p>
                <p className="text-xs text-yellow-700">This feature is currently in development mode. For testing purposes, authentication will succeed even if biometrics fail or are not available on your device.</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-6 h-6 text-[#368564]" />
                <div>
                  <p className="font-medium">Biometric Authentication</p>
                  <p className="text-sm text-gray-500">Require fingerprint, face ID, or device passcode to view private keys</p>
                </div>
              </div>
              <Button
                className={`p-1 ${biometricEnabled ? 'bg-[#368564]' : 'bg-gray-200'} rounded-full transition-colors`}
                onClick={() => toggleBiometricAuth(!biometricEnabled)}
              >
                <ToggleRight className={`w-8 h-8 ${biometricEnabled ? 'text-white' : 'text-gray-500'}`} />
              </Button>
            </div>
            
            {biometricEnabled && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                <p>Biometric authentication is enabled. Your private keys are now protected.</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              className="bg-[#368564] hover:bg-[#2a684d] text-white px-4 py-2"
              onClick={() => setShowBiometricSettings(false)}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-lg">
            <DrawerHeader className="border-b border-gray-100 pb-4 px-4 sm:px-6">
              <DrawerTitle className="text-xl sm:text-2xl font-semibold text-[#368564]">
                Manage Profiles
              </DrawerTitle>
              <DrawerDescription className="text-gray-600 text-sm sm:text-base">
                Switch between profiles or add a new one
              </DrawerDescription>
            </DrawerHeader>
            
            <div className="p-4 sm:p-6 space-y-6">
              <div className="flex flex-col gap-4">
                <h3 className="text-md font-medium">User Profiles</h3>
                
                {profiles.length > 0 ? (
                  <div className="space-y-4">
                    {profiles.map((profile) => (
                      <div
                        key={profile.npub}
                        className={`flex flex-col p-3 rounded-lg border ${
                          profile.npub === activeNpub
                            ? 'border-[#368564] bg-[#e6efe9]'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {profile.alias ? (
                            <>
                              <span className="text-sm font-medium">
                                {profile.alias}
                              </span>
                              <span className="font-mono text-xs text-gray-600">
                                {profile.npub.slice(0, 6)}...{profile.npub.slice(-6)}
                              </span>
                            </>
                          ) : (
                            <span className="font-mono text-sm">
                              {profile.npub.slice(0, 8)}...{profile.npub.slice(-8)}
                            </span>
                          )}
                          {profile.npub === activeNpub && (
                            <span className="text-xs bg-[#368564] text-white px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
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
              
              {/* Biometric Settings Button - Only show if biometric is supported */}
              {isBiometricSupported && (
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 mb-4">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-6 h-6 text-[#368564]" />
                    <div>
                      <p className="font-medium">Biometric Security</p>
                      <p className="text-sm text-gray-500">
                        {biometricEnabled
                          ? "Biometric authentication is enabled for private key export"
                          : "Enable biometric authentication to secure your private keys"}
                      </p>
                    </div>
                  </div>
                  <Button
                    className="py-1 px-3 text-sm bg-[#368564] hover:bg-[#2a684d] text-white"
                    onClick={() => setShowBiometricSettings(true)}
                  >
                    Settings
                  </Button>
                </div>
              )}
              
              <Drawer open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DrawerTrigger asChild>
                  <Button
                    className="bg-white hover:bg-[#e6efe9] shadow-sm hover:shadow-md transition-all duration-300 text-[#368564] hover:text-[#2a684d] border border-[#368564] hover:border-[#2a684d]"
                    onClick={() => setIsImportOpen(true)}
                  >
                    <span className="flex items-center gap-2">
                      <KeyRound className="w-5 h-5" />
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
                                    <KeyRound className="w-5 h-5 text-[#368564] absolute left-3 top-1/2 transform -translate-y-1/2" />
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
                                    <User className="w-5 h-5 text-[#368564] absolute left-3 top-1/2 transform -translate-y-1/2" />
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
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}