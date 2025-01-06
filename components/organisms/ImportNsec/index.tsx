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
    // TODO: Implement the submission logic here
    // nsec15wyv3jys7aqtjf49ccaje0pusg2yltkd0j2e947wfrme0u8v6xxq85fjh3
    console.log(values)
    const nsec = values.nsec
    const npub = nip19.npubEncode(getPublicKey(nip19.decode(nsec).data as Uint8Array))
    const profile = {
        metadata: await GetNpubProfileMetadata(npub)
    }
    console.log(nsec, npub, profile)
    saveKeyPairToLocalStorage(npub, nsec)
    saveProfileToLocalStorage(profile)
    // const existingKeyPair = getKeyPairFromLocalStorage();
    // await ReplyToNote("note187j8dxwta5zvxle446uqutxue764q79vxmtv85dw7fnujlqgdm2qm7kelc", "JSON.stringify(values)", existingKeyPair!.nsec)
    // setIsOpen(false)
  }

  return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button variant="outline">Import Nsec</Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Import Nsec</DrawerTitle>
              <DrawerDescription>Note: Importing your nsec would replace the current nsec</DrawerDescription>
            </DrawerHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-4">
                <FormField
                  control={form.control}
                  name="nsec"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nsec</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your nsec" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">Submit</Button>
              </form>
            </Form>
          </div>
        </DrawerContent>
      </Drawer>
  )
}

