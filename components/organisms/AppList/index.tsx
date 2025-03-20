'use client'
import React from 'react'
import { useState, useEffect } from 'react'
import { AppCard } from '@/components/molecules/AppCard'
import { useApps, APP_CATEGORIES } from '@/lib/hooks/useApps'
import MiniAppModal from '../MiniAppModal'
import { Button } from '@/components/ui/button'
import type { AppDetails } from '@/lib/hooks/useApps'

export default function AppLauncherList() {
  const [selectedApp, setSelectedApp] = useState<AppDetails | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("popular")
  const { apps, loading, error, refetch } = useApps();

  // Listen for drawer close events to refresh the list
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'apna_drawer_closed') {
        refetch(true);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refetch]);

  const handleAppSelect = (appURL: string | null, appId: string, isGeneratedApp?: boolean) => {
    const app = apps.find(a => a.id === appId);
    if (app) {
      setSelectedApp(app)
    }
  }

  const handleClose = () => {
    setSelectedApp(null)
  }

  const filteredApps = apps.filter(app => {
    if (selectedCategory === "popular") {
      return true; // Show all apps, they're already sorted by rating
    }
    return app.categories.includes(selectedCategory as any);
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-gray-600">Loading apps...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-8">
        <p className="text-red-600">Failed to load apps</p>
        <Button 
          onClick={() => refetch(true)}
          className="mt-4 px-4 py-2 bg-[#368564] text-white rounded-md hover:bg-[#2a6b4f]"
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-3xl mx-auto w-full">
        {/* Category Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex space-x-2 min-w-max pb-2">
            <button
              onClick={() => setSelectedCategory("popular")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${selectedCategory === "popular"
                  ? "bg-[#368564] text-white"
                  : "bg-[#e6efe9] text-[#368564] hover:bg-[#d1e4d9]"
                }`}
            >
              Most Popular
            </button>
            {APP_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${selectedCategory === category
                    ? "bg-[#368564] text-white"
                    : "bg-[#e6efe9] text-[#368564] hover:bg-[#d1e4d9]"
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          {filteredApps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              selected={selectedApp?.id === app.id}
              onSelect={handleAppSelect}
            />
          ))}
        </div>
        
        {filteredApps.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            {selectedCategory === "popular" 
              ? "No apps found"
              : `No apps found in ${selectedCategory} category`}
          </div>
        )}
      </div>

      <MiniAppModal
        isOpen={!!selectedApp}
        appUrl={selectedApp?.appURL || null}
        appId={selectedApp?.id || ""}
        appName={selectedApp?.appName || ""}
        onClose={handleClose}
        isGeneratedApp={selectedApp?.isGeneratedApp || false}
        htmlContent={selectedApp?.htmlContent || null}
      />
    </>
  )
}
