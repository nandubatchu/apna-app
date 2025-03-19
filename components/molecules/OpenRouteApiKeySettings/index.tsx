"use client";

import { useState, useEffect } from "react";
import { Key, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOpenRouteApiKey } from "@/lib/hooks/useOpenRouteApiKey";

/**
 * OpenRouteApiKeySettings component
 * 
 * A reusable component for managing the OpenRoute API key in settings.
 * This component provides UI for viewing, saving, and clearing the API key.
 */
export default function OpenRouteApiKeySettings() {
  const { apiKey, saveApiKey, clearApiKey, isLoaded } = useOpenRouteApiKey();
  const [inputApiKey, setInputApiKey] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  // Set the input value once the API key is loaded from localStorage
  useEffect(() => {
    if (isLoaded) {
      setInputApiKey(apiKey);
    }
  }, [apiKey, isLoaded]);

  const handleSaveApiKey = () => {
    try {
      saveApiKey(inputApiKey);
      setSaveStatus("success");
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    } catch (error) {
      setSaveStatus("error");
    }
  };

  const handleClearApiKey = () => {
    clearApiKey();
    setInputApiKey("");
    setSaveStatus("idle");
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg mb-4">
        <div className="flex items-start gap-3">
          <Key className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">
            Enter your OpenRoute API key below. This key is required for generating apps and will be stored securely in your browser&apos;s local storage.
            You can get an API key by signing up at <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">openrouter.ai</a>.
          </p>
        </div>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="api-key" className="text-sm font-medium">
          OpenRoute API Key
        </label>
        <div className="flex gap-2">
          <input
            id="api-key"
            type="password"
            className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#368564]"
            placeholder="Enter your OpenRoute API key"
            value={inputApiKey}
            onChange={(e) => setInputApiKey(e.target.value)}
          />
          <Button 
            onClick={handleSaveApiKey}
            className="bg-[#368564] hover:bg-[#2c6b51] text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button 
            onClick={handleClearApiKey}
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
        {saveStatus === "success" && (
          <p className="text-sm text-green-600">API key saved successfully!</p>
        )}
        {saveStatus === "error" && (
          <p className="text-sm text-red-600">Failed to save API key. Please try again.</p>
        )}
      </div>
    </div>
  );
}