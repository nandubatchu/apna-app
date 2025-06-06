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
import { APP_CATEGORIES, AppCategory, AppDetails } from "@/lib/types/apps"
import { Pencil } from "lucide-react"
import { revalidateTags } from "@/app/actions/feedback"

// Schema for external apps
const ExternalAppSchema = z.object({
  appType: z.literal("external"),
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

// Schema for generated apps
const GeneratedAppSchema = z.object({
  appType: z.literal("generated"),
  appName: z.string().min(2, {
    message: "App name must be at least 2 characters.",
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

// Combined schema with discriminated union
const FormSchema = z.discriminatedUnion("appType", [
  ExternalAppSchema,
  GeneratedAppSchema,
])

type FormData = z.infer<typeof FormSchema>

interface EditAppProps {
  app: AppDetails;
  onSuccess?: () => void;
}

export default function EditApp({ app, onSuccess }: EditAppProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [selectedCategories, setSelectedCategories] = useState<AppCategory[]>(app.categories)
  
  // Determine app type based on the app properties
  const appType = app.isGeneratedApp ? "generated" : "external"

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      appType,
      appName: app.appName,
      ...(app.appURL ? { appUrl: app.appURL } : {}),
      categories: app.categories,
      mode: "Full-page",
      description: app.description,
    } as FormData,
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
      let submitData;
      
      if (data.appType === "external") {
        submitData = {
          appName: data.appName,
          appURL: data.appUrl,
          categories: data.categories,
          mode: data.mode,
          description: data.description,
        };
      } else {
        // For generated apps
        submitData = {
          appName: data.appName,
          htmlContent: app.htmlContent, // Keep the original HTML content
          categories: data.categories,
          mode: data.mode,
          description: data.description,
          isGeneratedApp: true,
        };
      }

      const existingKeyPair = getKeyPairFromLocalStorage();
      if (!existingKeyPair) {
        console.error('No keypair found');
        return;
      }

      // Reply to the app's note ID instead of the original submission note
      revalidateTags(['ApnaMiniAppDetails', app.id]);
      await ReplyToNote(
        app.id, // Use the app's note ID for the reply
        JSON.stringify(submitData),
        existingKeyPair.nsec
      );

      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to update app:', error);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader className="border-b border-gray-100 pb-4 px-4 sm:px-6">
            <DrawerTitle className="text-xl sm:text-2xl font-semibold text-[#368564]">
              Edit App
            </DrawerTitle>
            <DrawerDescription className="text-gray-600 text-sm sm:text-base">
              Update your app details
            </DrawerDescription>
          </DrawerHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 sm:p-6">
              {/* App Type Information */}
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mb-4">
                <p className="text-sm font-medium text-gray-700">
                  App Type: {app.isGeneratedApp ? "Generated App" : "External App"}
                </p>
                {app.isGeneratedApp && (
                  <p className="text-xs text-gray-500 mt-1">
                    Generated apps maintain their HTML content when updated
                  </p>
                )}
              </div>
              
              {/* App Name - Common for both types */}
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
              
              {/* App URL - Only for external apps */}
              {appType === "external" && (
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
              )}
              
              {/* HTML Content Preview - Only for generated apps */}
              {appType === "generated" && app.htmlContent && (
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-sm font-medium text-gray-700">HTML Content</p>
                  <p className="text-xs text-gray-500 mt-1">
                    The HTML content of this generated app will be preserved when updating
                  </p>
                </div>
              )}
              
              {/* Categories - Common for both types */}
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
              
              {/* Description - Common for both types */}
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
                Update App
              </Button>
            </form>
          </Form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}