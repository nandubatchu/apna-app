import { useState, useEffect, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { generatedAppsDB, GeneratedApp, ChatMessage } from '@/lib/generatedAppsDB';

export function useGeneratedApps() {
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
  const createApp = useCallback(async (name: string, htmlContent: string, messages: ChatMessage[]) => {
    try {
      const newApp: GeneratedApp = {
        id: `generated-${nanoid(8)}`,
        name,
        htmlContent,
        htmlContents: [htmlContent],
        messages,
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

  return {
    apps,
    loading,
    error,
    createApp,
    updateApp,
    deleteApp,
    getApp,
    refreshApps: fetchApps
  };
}