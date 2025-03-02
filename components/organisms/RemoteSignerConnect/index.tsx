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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  parseRemoteSignerInput,
  connectToRemoteSigner,
  disconnectFromRemoteSigner
} from "@/lib/nostr/nip46"
import {
  addRemoteSignerProfileToLocalStorage,
  getUserProfileByNpub,
  removeUserProfileFromLocalStorage,
  getRemoteSignerProfiles
} from "@/lib/utils"
import * as nip19 from 'nostr-tools/nip19'
import { KeyRound, Link, ExternalLink, Unlink } from "lucide-react"

const formSchema = z.object({
  bunkerUrl: z.string().min(1, {
    message: "Bunker URL is required",
  }),
  alias: z.string().optional()
})

interface RemoteSignerConnectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectionChange?: () => void;
}

export default function RemoteSignerConnect({ open, onOpenChange, onConnectionChange }: RemoteSignerConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authUrl, setAuthUrl] = useState<string | null>(null)
  const [connections, setConnections] = useState<Record<string, {
    bunkerUrl: string;
    alias?: string;
    timestamp: number;
  }>>({})
  const [confirmDisconnectPubkey, setConfirmDisconnectPubkey] = useState<string | null>(null)

  // Load connections on mount
  useEffect(() => {
    if (open) {
      loadConnections()
    }
  }, [open])

  const loadConnections = () => {
    const remoteProfiles = getRemoteSignerProfiles()
    
    // Convert to the format expected by the component
    const connectionsMap: Record<string, {
      bunkerUrl: string;
      alias?: string;
      timestamp: number;
    }> = {};
    
    remoteProfiles.forEach(profile => {
      connectionsMap[profile.npub] = {
        bunkerUrl: profile.nsec || '', // In remote profiles, we store the bunker URL in the nsec field
        alias: profile.alias,
        timestamp: Date.now()
      };
    });
    
    setConnections(connectionsMap)
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bunkerUrl: "",
      alias: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsConnecting(true)
      setError(null)

      // Parse the bunker URL
      const bunkerPointer = await parseRemoteSignerInput(values.bunkerUrl)
      if (!bunkerPointer) {
        throw new Error("Invalid bunker URL or NIP-05 identifier")
      }

      // Connect to the remote signer
      const connection = await connectToRemoteSigner(
        bunkerPointer,
        (url) => {
          // Handle auth URL if needed
          setAuthUrl(url)
        }
      )

      if (!connection || !connection.userPubkey) {
        throw new Error("Failed to connect to remote signer")
      }

      // Save the connection to user profiles
      // connection.userPubkey is the raw pubkey, so we need to encode it as npub
      const nip19 = require('nostr-tools/nip19');
      const npub = nip19.npubEncode(connection.userPubkey);
      
      addRemoteSignerProfileToLocalStorage(
        npub, // Pass the encoded npub
        values.bunkerUrl,
        true, // Set as active
        values.alias
      )

      // Reset form and update UI
      form.reset()
      loadConnections()
      
      // Notify parent component if needed
      if (onConnectionChange) {
        onConnectionChange()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to remote signer")
    } finally {
      setIsConnecting(false)
    }
  }

  async function handleDisconnect(pubkey: string) {
    setConfirmDisconnectPubkey(pubkey)
  }

  async function confirmDisconnect() {
    if (!confirmDisconnectPubkey) return

    try {
      // Disconnect from the remote signer
      await disconnectFromRemoteSigner(confirmDisconnectPubkey)
      
      // Remove from user profiles
      removeUserProfileFromLocalStorage(confirmDisconnectPubkey)
      
      // Update UI
      loadConnections()
      setConfirmDisconnectPubkey(null)
      
      // Notify parent component if needed
      if (onConnectionChange) {
        onConnectionChange()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect from remote signer")
    }
  }

  function formatPubkey(pubkey: string): string {
    try {
      return nip19.npubEncode(pubkey)
    } catch (error) {
      return pubkey
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
      
      {/* Auth URL Dialog */}
      <Dialog open={!!authUrl} onOpenChange={() => setAuthUrl(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Authentication Required</DialogTitle>
          </DialogHeader>
          <div className="text-gray-700 mt-2">
            <p className="mb-4">The remote signer requires authentication. Please visit the following URL to authenticate:</p>
            <div className="bg-gray-100 p-3 rounded-md break-all">
              <a 
                href={authUrl || "#"} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-2"
              >
                {authUrl}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="mt-4 text-sm text-gray-500">After authenticating, you&apos;ll be able to use the remote signer.</p>
          </div>
          <Button
            onClick={() => setAuthUrl(null)}
            className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Disconnect Dialog */}
      <Dialog open={!!confirmDisconnectPubkey} onOpenChange={() => setConfirmDisconnectPubkey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Disconnect</DialogTitle>
            <div className="text-sm text-gray-500 mt-1">
              Are you sure you want to disconnect from this remote signer?
            </div>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 px-4 py-2"
              onClick={() => setConfirmDisconnectPubkey(null)}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2"
              onClick={confirmDisconnect}
            >
              Disconnect
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <h3 className="text-md font-medium">Remote Signer Connections</h3>
          
          {Object.keys(connections).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(connections).map(([pubkey, connection]) => (
                <div
                  key={pubkey}
                  className="flex flex-col p-3 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {connection.alias ? (
                      <>
                        <span className="text-sm font-medium">
                          {connection.alias}
                        </span>
                        <span className="font-mono text-xs text-gray-600">
                          {formatPubkey(pubkey).slice(0, 10)}...{formatPubkey(pubkey).slice(-6)}
                        </span>
                      </>
                    ) : (
                      <span className="font-mono text-sm">
                        {formatPubkey(pubkey).slice(0, 10)}...{formatPubkey(pubkey).slice(-6)}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Link className="w-3 h-3" />
                      {connection.bunkerUrl}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="py-1 px-2 text-sm bg-red-500 hover:bg-red-600 text-white"
                      onClick={() => handleDisconnect(pubkey)}
                    >
                      <Unlink className="w-3 h-3 mr-1" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">No remote signer connections</div>
          )}
        </div>
        
        <div className="border-t pt-4">
          <h3 className="text-md font-medium mb-4">Connect to Remote Signer</h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="bunkerUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Bunker URL or NIP-05</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="bunker://... or name@domain.com"
                          {...field}
                          className="border-gray-200 focus:border-[#368564] focus:ring-[#e6efe9] pl-10"
                        />
                        <Link className="w-5 h-5 text-[#368564] absolute left-3 top-1/2 transform -translate-y-1/2" />
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
                          placeholder="Enter a name for this connection"
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
              
              <Button
                type="submit"
                className="w-full bg-[#368564] hover:bg-[#2a684d] text-white font-semibold py-2 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md"
                disabled={isConnecting}
              >
                {isConnecting ? "Connecting..." : "Connect to Remote Signer"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </>
  )
}