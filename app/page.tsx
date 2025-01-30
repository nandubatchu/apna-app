"use client"
import { useState } from 'react';
import { useProfile } from "@/lib/hooks/useProfile";
import { useSearchParams, useRouter } from 'next/navigation';
import { useFavorites } from '@/lib/hooks/useFavorites';
import FeaturedApps, { FEATURED_APPS } from "@/components/organisms/FeaturedApps";
import FavoriteAppsGrid from "@/components/organisms/FavoriteAppsGrid";
import MiniAppModal from "@/components/organisms/MiniAppModal";
import BottomNav from "@/components/organisms/BottomNav";
import type { AppDetails } from '@/lib/hooks/useApps';

export default function HomePage() {
  const { loading: profileLoading, error: profileError } = useProfile();
  const { favoriteApps } = useFavorites();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedApp, setSelectedApp] = useState<{
    url: string;
    id: string;
    name: string;
  } | null>(null);

  const handleAppSelect = (appURL: string, appId: string, appName: string) => {
    // Update URL with query params
    const params = new URLSearchParams();
    params.set('appUrl', appURL);
    params.set('appId', appId);
    router.push(`/?${params.toString()}`);
    
    setSelectedApp({
      url: appURL,
      id: appId,
      name: appName
    });
  };

  const handleModalClose = () => {
    // Remove query params when closing
    router.push('/');
    setSelectedApp(null);
  };

  if (profileLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#f8faf9] flex items-center justify-center">
        <p className="text-gray-600">Initializing profile...</p>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-[100dvh] bg-[#f8faf9] flex items-center justify-center">
        <p className="text-red-600">Failed to initialize profile: {profileError}</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-[100dvh] bg-[#f8faf9] overflow-x-hidden">
        <div className="p-4 pb-20 space-y-8">
          <FeaturedApps 
            onAppSelect={(url, id) => {
              const app = FEATURED_APPS.find(a => a.id === id);
              if (app) {
                handleAppSelect(url, id, app.appName);
              }
            }} 
          />
          <FavoriteAppsGrid 
            onAppSelect={(url, id) => {
              const app = favoriteApps.find(a => a.id === id);
              if (app) {
                handleAppSelect(url, id, app.appName);
              }
            }}
          />
        </div>
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
      
      <BottomNav />
    </>
  );
}
