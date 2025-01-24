"use client"
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { useApps } from '@/lib/hooks/useApps';
import { SimpleAppCard } from '@/components/molecules/SimpleAppCard';
import MiniAppModal from '@/components/organisms/MiniAppModal';
import type { AppDetails } from '@/lib/hooks/useApps';

export default function FavoritesList() {
  const { favoriteApps, loading: favoritesLoading } = useFavorites();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedApp, setSelectedApp] = useState<{
    url: string;
    id: string;
    name: string;
  } | null>(null);

  // Initialize from URL params on mount
  useEffect(() => {
    const appUrl = searchParams.get('appUrl');
    const appId = searchParams.get('appId');
    
    if (appUrl && appId && !selectedApp) {
      const app = favoriteApps.find(a => a.id === appId);
      if (app) {
        setSelectedApp({
          url: appUrl,
          id: appId,
          name: app.appName
        });
      }
    }
  }, [searchParams, favoriteApps]);

  const handleAppSelect = (appURL: string, appId: string) => {
    const app = favoriteApps.find(a => a.id === appId);
    if (app) {
      // Update URL with query params
      const params = new URLSearchParams();
      params.set('appUrl', appURL);
      params.set('appId', appId);
      router.push(`/?${params.toString()}`);
      
      setSelectedApp({
        url: appURL,
        id: appId,
        name: app.appName
      });
    }
  };

  const handleModalClose = () => {
    // Remove query params when closing
    router.push('/');
    setSelectedApp(null);
  };

  if (favoritesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-gray-600">Loading apps...</p>
      </div>
    );
  }

  if (favoriteApps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
        <p className="text-gray-600 mb-2">No favorite apps yet</p>
        <p className="text-sm text-gray-500">
          Visit Explore to discover and favorite apps
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col w-full space-y-3">
        {favoriteApps.map((app) => (
          <SimpleAppCard 
            key={app.id} 
            app={app}
            onSelect={handleAppSelect}
          />
        ))}
      </div>
      
      {selectedApp && (
        <MiniAppModal 
          isOpen={true}
          onClose={handleModalClose}
          appUrl={selectedApp.url}
          appId={selectedApp.id}
          appName={selectedApp.name}
        />
      )}
    </>
  );
}