"use client";

import { useState, useEffect } from "react";
import { Key, Save, Trash2, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOpenRouteApiKey } from "@/lib/hooks/useOpenRouteApiKey";

/**
 * OpenRouteApiKeySettings component
 *
 * A reusable component for managing the OpenRoute API key and model settings.
 * This component provides UI for viewing, saving, and clearing the API key and model.
 */
export default function OpenRouteApiKeySettings() {
  const { apiKey, model, saveApiKey, saveModel, clearApiKey, clearModel, isLoaded } = useOpenRouteApiKey();
  const [inputApiKey, setInputApiKey] = useState("");
  const [inputModel, setInputModel] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  // Set the input values once they are loaded from localStorage
  useEffect(() => {
    if (isLoaded) {
      setInputApiKey(apiKey);
      setInputModel(model);
    }
  }, [apiKey, model, isLoaded]);

  const handleSaveSettings = () => {
    try {
      saveApiKey(inputApiKey);
      saveModel(inputModel);
      setSaveStatus("success");
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    } catch (error) {
      setSaveStatus("error");
    }
  };

  const handleClearSettings = () => {
    clearApiKey();
    clearModel();
    setInputApiKey("");
    setInputModel("");
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
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="api-key" className="text-sm font-medium">
            OpenRoute API Key
          </label>
          <input
            id="api-key"
            type="password"
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#368564]"
            placeholder="Enter your OpenRoute API key"
            value={inputApiKey}
            onChange={(e) => setInputApiKey(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label htmlFor="model" className="text-sm font-medium">
              Model Identifier (Optional)
            </label>
            <div className="relative group">
              <span className="cursor-help text-gray-400 text-xs">ⓘ</span>
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 w-64 z-10">
                Enter a specific model identifier (e.g., &quot;anthropic/claude-3.7-sonnet&quot;). If left empty, the default model will be used.
              </div>
            </div>
          </div>
          <input
            id="model"
            type="text"
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#368564]"
            placeholder="e.g., anthropic/claude-3.7-sonnet"
            value={inputModel}
            onChange={(e) => setInputModel(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSaveSettings}
            className="bg-[#368564] hover:bg-[#2c6b51] text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
          <Button
            onClick={handleClearSettings}
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Settings
          </Button>
        </div>
        
        {saveStatus === "success" && (
          <p className="text-sm text-green-600">Settings saved successfully!</p>
        )}
        {saveStatus === "error" && (
          <p className="text-sm text-red-600">Failed to save settings. Please try again.</p>
        )}
      </div>
    </div>
  );
}