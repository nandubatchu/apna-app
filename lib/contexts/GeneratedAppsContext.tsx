"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { generatedAppsDB, GeneratedApp } from '@/lib/generatedAppsDB';

interface GeneratedAppsContextType {
  apps: GeneratedApp[];
  loading: boolean;
  error: string | null;
  createApp: (name: string, htmlContent: string, prompt: string) => Promise<string>;
  updateApp: (id: string, updates: Partial<Omit<GeneratedApp, 'id' | 'createdAt'>>) => Promise<void>;
  deleteApp: (id: string) => Promise<void>;
  getApp: (id: string) => Promise<GeneratedApp | undefined>;
  refreshApps: () => Promise<void>;
}

const GeneratedAppsContext = createContext<GeneratedAppsContextType | undefined>(undefined);

export function GeneratedAppsProvider({ children }: { children: React.ReactNode }) {
  const [apps, setApps] = useState<GeneratedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all apps
  const fetchApps = useCallback(async () => {
    try {
      setLoading(true);
      const allApps = await generatedAppsDB.getAllApps();
      setApps(allApps);
      setError(null);
    } catch (err) {
      console.error('Error fetching generated apps:', err);
      setError('Failed to load generated apps');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new app
  const createApp = useCallback(async (name: string, htmlContent: string, prompt: string) => {
    try {
      const newApp: GeneratedApp = {
        id: `generated-${nanoid(8)}`,
        name,
        htmlContent,
        prompt,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      await generatedAppsDB.addApp(newApp);
      await fetchApps(); // Refresh the list
      return newApp.id;
    } catch (err) {
      console.error('Error creating generated app:', err);
      throw err;
    }
  }, [fetchApps]);

  // Update an existing app
  const updateApp = useCallback(async (
    id: string, 
    updates: Partial<Omit<GeneratedApp, 'id' | 'createdAt'>>
  ) => {
    try {
      await generatedAppsDB.updateApp(id, updates);
      await fetchApps(); // Refresh the list
    } catch (err) {
      console.error('Error updating generated app:', err);
      throw err;
    }
  }, [fetchApps]);

  // Delete an app
  const deleteApp = useCallback(async (id: string) => {
    try {
      await generatedAppsDB.deleteApp(id);
      await fetchApps(); // Refresh the list
    } catch (err) {
      console.error('Error deleting generated app:', err);
      throw err;
    }
  }, [fetchApps]);

  // Get a single app by ID
  const getApp = useCallback(async (id: string) => {
    try {
      return await generatedAppsDB.getApp(id);
    } catch (err) {
      console.error('Error getting generated app:', err);
      throw err;
    }
  }, []);

  // Load apps on initial mount
  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const value = {
    apps,
    loading,
    error,
    createApp,
    updateApp,
    deleteApp,
    getApp,
    refreshApps: fetchApps
  };

  return (
    <GeneratedAppsContext.Provider value={value}>
      {children}
    </GeneratedAppsContext.Provider>
  );
}

export function useGeneratedApps() {
  const context = useContext(GeneratedAppsContext);
  if (context === undefined) {
    throw new Error('useGeneratedApps must be used within a GeneratedAppsProvider');
  }
  return context;
}