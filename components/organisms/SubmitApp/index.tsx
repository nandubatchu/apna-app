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
import { Textarea } from "@/components/ui/textarea"
import { ReplyToNote } from "@/lib/nostr"
import { getKeyPairFromLocalStorage } from "@/lib/utils"
import { APP_CATEGORIES, AppCategory } from "@/lib/hooks/useApps"

const FormSchema = z.object({
  appName: z.string().min(2, {
    message: "App name must be at least 2 characters.",
  }),
  appUrl: z.string().url({
    message: "Please enter a valid URL.",
  }),
  categories: z.array(z.enum(APP_CATEGORIES)).min(1, {
    message: "Please select at least one category.",
  }),
  mode: z.literal("Full-page"),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }).max(500, {
    message: "Description must not exceed 500 characters.",
  }),
})

type FormData = z.infer<typeof FormSchema>

export default function SubmitNewApp() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<AppCategory[]>([])

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      appName: "",
      appUrl: "",
      categories: [],
      mode: "Full-page",
      description: "",
    },
  })

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Trigger a refresh of the app list when drawer closes
      localStorage.setItem('apna_drawer_closed', Date.now().toString());
      // Remove it immediately to allow future triggers
      localStorage.removeItem('apna_drawer_closed');
    }
  };

  const toggleCategory = (category: AppCategory) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    setSelectedCategories(newCategories);
    form.setValue('categories', newCategories);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const submitData = {
        appName: data.appName,
        appURL: data.appUrl, // Note: capital URL to match expected structure
        categories: data.categories,
        mode: data.mode,
        description: data.description,
      };

      const existingKeyPair = getKeyPairFromLocalStorage();
      if (!existingKeyPair) {
        console.error('No keypair found');
        return;
      }

      await ReplyToNote(
        "note187j8dxwta5zvxle446uqutxue764q79vxmtv85dw7fnujlqgdm2qm7kelc",
        JSON.stringify(submitData),
        existingKeyPair.nsec
      );

      setIsOpen(false);
      form.reset();
      setSelectedCategories([]);
    } catch (error) {
      console.error('Failed to submit app:', error);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
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
              <FormField
                control={form.control}
                name="categories"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Categories (select multiple)</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {APP_CATEGORIES.map((category) => (
                        <Button
                          key={category}
                          type="button"
                          variant="outline"
                          onClick={() => toggleCategory(category)}
                          className={`rounded-full px-3 py-1 text-sm ${
                            selectedCategories.includes(category)
                              ? "bg-[#368564] text-white border-[#368564]"
                              : "bg-white text-gray-700 border-gray-200 hover:bg-[#e6efe9]"
                          }`}
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your app (max 500 characters)"
                        {...field}
                        className="border-gray-200 focus:border-[#368564] focus:ring-[#e6efe9] min-h-[100px]"
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
