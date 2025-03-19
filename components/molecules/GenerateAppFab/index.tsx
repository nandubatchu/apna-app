"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";
import { nanoid } from "nanoid";
import { useGeneratedApps } from "@/lib/contexts/GeneratedAppsContext";
import { createInitialMessages } from "@/lib/utils/htmlTemplates";
import { ChatMessage } from "@/lib/generatedAppsDB";

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

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create initial messages from the prompt
      const initialMessages = createInitialMessages(prompt.trim());
      
      const response = await fetch("/api/generate-html", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: initialMessages }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate HTML");
      }

      const data = await response.json();
      
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

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 rounded-full w-14 h-14 shadow-lg bg-[#368564] hover:bg-[#2c6b51] z-50"
        size="icon"
      >
        <Plus className="h-6 w-6 text-white" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate HTML App</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">App Name:</p>
              <input
                type="text"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#368564]"
                placeholder="Generated App"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                disabled={isLoading}
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
                disabled={isLoading}
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
              disabled={isLoading}
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