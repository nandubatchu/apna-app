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
import { ReplyToNote } from "@/lib/nostr"
import { getKeyPairFromLocalStorage } from "@/lib/utils"

const formSchema = z.object({
  appName: z.string().min(2, {
    message: "App name must be at least 2 characters.",
  }),
  appUrl: z.string().url({
    message: "Please enter a valid URL.",
  }),
})

export default function SubmitNewApp() {
  const [isOpen, setIsOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      appName: "",
      appUrl: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // TODO: Implement the submission logic here
    console.log(values)
    const existingKeyPair = getKeyPairFromLocalStorage();
    await ReplyToNote("note187j8dxwta5zvxle446uqutxue764q79vxmtv85dw7fnujlqgdm2qm7kelc", "JSON.stringify(values)", existingKeyPair!.nsec)
    setIsOpen(false)
  }

  return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="default"
            className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-[#368564] hover:bg-[#2a684d] text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center p-0 z-50"
            aria-label="Submit New App"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mx-auto w-full max-w-lg">
            <DrawerHeader className="border-b border-gray-100 pb-4 px-4 sm:px-6">
              <DrawerTitle className="text-xl sm:text-2xl font-semibold text-[#368564]">
                Submit New App
              </DrawerTitle>
              <DrawerDescription className="text-gray-600 text-sm sm:text-base">
                Share your app with the Apna community
              </DrawerDescription>
            </DrawerHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 sm:p-6">
                <FormField
                  control={form.control}
                  name="appName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">App Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter app name"
                          {...field}
                          className="border-gray-200 focus:border-[#368564] focus:ring-[#e6efe9]"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="appUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">App URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://your-app-url.com"
                          {...field}
                          className="border-gray-200 focus:border-[#368564] focus:ring-[#e6efe9]"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-[#368564] hover:bg-[#2a684d] text-white font-semibold py-2 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  Submit App
                </Button>
              </form>
            </Form>
          </div>
        </DrawerContent>
      </Drawer>
  )
}

