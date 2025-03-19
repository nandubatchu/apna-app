"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "openroute-api-key";

export function useOpenRouteApiKey() {
  const [apiKey, setApiKey] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load the API key from localStorage on component mount
  useEffect(() => {
    try {
      const storedKey = localStorage.getItem(STORAGE_KEY) || "";
      setApiKey(storedKey);
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save the API key to localStorage whenever it changes
  const saveApiKey = (key: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, key);
      setApiKey(key);
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  // Clear the API key from localStorage
  const clearApiKey = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setApiKey("");
    } catch (error) {
      console.error("Error removing from localStorage:", error);
    }
  };

  return {
    apiKey,
    saveApiKey,
    clearApiKey,
    isLoaded
  };
}