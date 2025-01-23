"use client"
import { useState, useEffect, useCallback } from 'react';
import { favoritesDB, type FavoriteApp } from '../favoritesDB';
import type { AppDetails } from './useApps';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteApps, setFavoriteApps] = useState<AppDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    try {
      const favs = await favoritesDB.getFavorites();
      setFavorites(favs.map(f => f.id));
      
      // Set initial apps from cached data
      const cachedApps = favs
        .filter(f => f.appData)
        .map(f => f.appData as AppDetails);
      
      if (cachedApps.length > 0) {
        setFavoriteApps(cachedApps);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load favorites on mount
  useEffect(() => {
    loadFavorites();
  }, []);

  const toggleFavorite = useCallback(async (appId: string, appData?: AppDetails) => {
    const isFav = await favoritesDB.isFavorite(appId);
    
    // Optimistically update UI state
    if (isFav) {
      setFavorites(prev => prev.filter(id => id !== appId));
      setFavoriteApps(prev => prev.filter(app => app.id !== appId));
    } else {
      setFavorites(prev => [...prev, appId]);
      if (appData) {
        setFavoriteApps(prev => [...prev, appData]);
      }
    }

    try {
      // Persist changes to IndexedDB
      if (isFav) {
        await favoritesDB.removeFavorite(appId);
      } else {
        await favoritesDB.addFavorite(appId, appData);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      // Revert UI state on error
      if (isFav) {
        setFavorites(prev => [...prev, appId]);
        if (appData) {
          setFavoriteApps(prev => [...prev, appData]);
        }
      } else {
        setFavorites(prev => prev.filter(id => id !== appId));
        setFavoriteApps(prev => prev.filter(app => app.id !== appId));
      }
    }
  }, []);

  const isFavorite = useCallback(async (appId: string): Promise<boolean> => {
    try {
      return await favoritesDB.isFavorite(appId);
    } catch (error) {
      console.error('Failed to check favorite status:', error);
      return false;
    }
  }, []);

  const updateAppData = useCallback(async (appId: string, appData: AppDetails) => {
    try {
      if (favorites.includes(appId)) {
        await favoritesDB.updateAppData(appId, appData);
        setFavoriteApps(prev => 
          prev.map(app => app.id === appId ? appData : app)
        );
      }
    } catch (error) {
      console.error('Failed to update app data:', error);
    }
  }, [favorites]);

  return {
    favorites,
    favoriteApps,
    loading,
    toggleFavorite,
    isFavorite,
    updateAppData
  };
}