"use client"

import React, { useState } from "react"
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
import { GetNpubProfileMetadata, ReplyToNote } from "@/lib/nostr"
import { getKeyPairFromLocalStorage, saveKeyPairToLocalStorage, saveProfileToLocalStorage } from "@/lib/utils"
import { getPublicKey, nip19 } from "nostr-tools"

const formSchema = z.object({
  nsec: z.string().startsWith("nsec", {
    message: `Nsec is invalid! Should start with "nsec"`,
  })
})

export default function ImportNsecApp() {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeNpub, setActiveNpub] = useState<string | null>(null)

  // Get active npub on mount
  React.useEffect(() => {
    const keyPair = getKeyPairFromLocalStorage()
    if (keyPair && keyPair.npub) {
      setActiveNpub(keyPair.npub)
    }
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nsec: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const nsec = values.nsec
      const decodedNsec = nip19.decode(nsec)
      if (!decodedNsec || !decodedNsec.data) {
        throw new Error("Invalid nsec key")
      }
      
      const npub = nip19.npubEncode(getPublicKey(decodedNsec.data as Uint8Array))
      const profile = {
        metadata: await GetNpubProfileMetadata(npub)
      }
      
      saveKeyPairToLocalStorage(npub, nsec)
      saveProfileToLocalStorage(profile)
      
      // Update active npub, reset form and close drawer on success
      setActiveNpub(npub)
      form.reset()
      setIsOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import nsec key")
    }
  }

  return (
    <>
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
      
      <div className="flex flex-col items-start gap-2">
        {activeNpub && (
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <span className="bg-[#e6efe9] text-[#368564] px-2 py-1 rounded-md font-mono">
              {activeNpub.slice(0, 8)}...{activeNpub.slice(-8)}
            </span>
            <span className="text-xs">Active Key</span>
          </div>
        )}
        
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" className="bg-white hover:bg-[#e6efe9] shadow-sm hover:shadow-md transition-all duration-300 text-[#368564] hover:text-[#2a684d] border-[#368564] hover:border-[#2a684d]">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Import Nsec
              </span>
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="mx-auto w-full max-w-lg">
              <DrawerHeader className="border-b border-gray-100 pb-4 px-4 sm:px-6">
                <DrawerTitle className="text-xl sm:text-2xl font-semibold text-[#368564]">
                  Import Nsec
                </DrawerTitle>
                <DrawerDescription className="text-gray-600 text-sm sm:text-base">
                  Note: Importing your nsec will replace the current nsec
                </DrawerDescription>
              </DrawerHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 sm:p-6">
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
