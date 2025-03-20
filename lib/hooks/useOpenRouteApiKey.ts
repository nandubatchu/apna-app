"use client";

import { useState, useEffect } from "react";

const API_KEY_STORAGE_KEY = "openroute-api-key";
const MODEL_STORAGE_KEY = "openroute-model";

export function useOpenRouteApiKey() {
  const [apiKey, setApiKey] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load the API key and model from localStorage on component mount
  useEffect(() => {
    try {
      const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY) || "";
      const storedModel = localStorage.getItem(MODEL_STORAGE_KEY) || "";
      setApiKey(storedKey);
      setModel(storedModel);
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save the API key to localStorage
  const saveApiKey = (key: string) => {
    try {
      localStorage.setItem(API_KEY_STORAGE_KEY, key);
      setApiKey(key);
    } catch (error) {
      console.error("Error saving API key to localStorage:", error);
    }
  };

  // Save the model to localStorage
  const saveModel = (modelId: string) => {
    try {
      localStorage.setItem(MODEL_STORAGE_KEY, modelId);
      setModel(modelId);
    } catch (error) {
      console.error("Error saving model to localStorage:", error);
    }
  };

  // Clear the API key and model from localStorage
  const clearApiKey = () => {
    try {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
      setApiKey("");
    } catch (error) {
      console.error("Error removing API key from localStorage:", error);
    }
  };

  // Clear the model from localStorage
  const clearModel = () => {
    try {
      localStorage.removeItem(MODEL_STORAGE_KEY);
      setModel("");
    } catch (error) {
      console.error("Error removing model from localStorage:", error);
    }
  };

  return {
    apiKey,
    model,
    saveApiKey,
    saveModel,
    clearApiKey,
    clearModel,
    isLoaded
  };
}