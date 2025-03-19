"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, AlertTriangle } from "lucide-react";
import { nanoid } from "nanoid";
import { useGeneratedApps } from "@/lib/contexts/GeneratedAppsContext";
import { createInitialMessages } from "@/lib/utils/htmlTemplates";
import { ChatMessage } from "@/lib/generatedAppsDB";
import { useOpenRouteApiKey } from "@/lib/hooks/useOpenRouteApiKey";
import { useRouter } from "next/navigation";
import { callOpenRouterApi } from "@/lib/utils/openRouterApi";

interface GenerateAppFabProps {
  onGenerateApp: (htmlContent: string, appId: string, messages: ChatMessage[], appName: string) => void;
}

export default function GenerateAppFab({ onGenerateApp }: GenerateAppFabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [appName, setAppName] = useState("Generated App");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createApp, refreshApps } = useGeneratedApps();
  const { apiKey, isLoaded } = useOpenRouteApiKey();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    if (!apiKey) {
      setError("OpenRoute API key is required. Please add it in the settings.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call the OpenRouter API directly using the client-side utility
      const data = await callOpenRouterApi({
        prompt: prompt.trim(),
        apiKey: apiKey
      });
      
      if (data.html && data.messages) {
        // Create a new app in the database with messages array
        const appId = await createApp(
          appName || "Generated App",
          data.html,
          data.messages
        );
        
        // Explicitly refresh the apps list to ensure the UI updates
        await refreshApps();
        
        // Notify parent component with messages instead of prompt
        onGenerateApp(data.html, appId, data.messages, appName || "Generated App");
        
        setIsOpen(false);
        setPrompt("");
        setAppName("Generated App");
      } else {
        throw new Error("No HTML content generated");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSettings = () => {
    router.push('/settings');
    setIsOpen(false);
  };

  return (
    <>
      {isLoaded && apiKey && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 rounded-full w-14 h-14 shadow-lg bg-[#368564] hover:bg-[#2c6b51] z-50"
          size="icon"
        >
          <Plus className="h-6 w-6 text-white" />
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate HTML App</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!apiKey && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">API Key Required</p>
                    <p className="text-sm text-amber-700 mt-1">
                      You need to add your OpenRoute API key in settings to generate apps.
                    </p>
                    <Button
                      onClick={handleOpenSettings}
                      variant="outline"
                      className="mt-2 text-amber-700 border-amber-300 hover:bg-amber-100"
                    >
                      Go to Settings
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-sm text-gray-500">App Name:</p>
              <input
                type="text"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#368564]"
                placeholder="Generated App"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                disabled={isLoading || !apiKey}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Describe the functionality you want in your generated app:
              </p>
              <textarea
                className="w-full min-h-[120px] p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#368564]"
                placeholder="e.g., call nostr.getActiveUserProfile and display the profile result"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading || !apiKey}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="bg-[#368564] hover:bg-[#2c6b51] text-white"
              disabled={isLoading || !apiKey}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}