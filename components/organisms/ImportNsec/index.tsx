"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nsec: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const nsec = values.nsec
    const npub = nip19.npubEncode(getPublicKey(nip19.decode(nsec).data as Uint8Array))
    const profile = {
        metadata: await GetNpubProfileMetadata(npub)
    }
    console.log(nsec, npub, profile)
    saveKeyPairToLocalStorage(npub, nsec)
    saveProfileToLocalStorage(profile)
  }

  return (
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
  )
}
