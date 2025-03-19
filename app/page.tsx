"use client"
import { useState, Suspense } from 'react';
import { useProfile } from "@/lib/hooks/useProfile";
import { useSearchParams, useRouter } from 'next/navigation';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { useGeneratedApps } from "@/lib/contexts/GeneratedAppsContext";
import FeaturedApps, { FEATURED_APPS } from "@/components/organisms/FeaturedApps";
import FavoriteAppsGrid from "@/components/organisms/FavoriteAppsGrid";
import GeneratedAppsGrid from "@/components/organisms/GeneratedAppsGrid";
import MiniAppModal from "@/components/organisms/MiniAppModal";
import GeneratedAppModal from "@/components/organisms/GeneratedAppModal";
import GenerateAppFab from "@/components/molecules/GenerateAppFab";
import BottomNav from "@/components/organisms/BottomNav";
import type { AppDetails } from '@/lib/hooks/useApps';
import { GeneratedApp } from '@/lib/generatedAppsDB';

function HomeContent() {
  const { loading: profileLoading, error: profileError } = useProfile();
  const { favoriteApps } = useFavorites();
  const { refreshApps } = useGeneratedApps();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedApp, setSelectedApp] = useState<{
    url: string;
    id: string;
    name: string;
  } | null>(() => {
    // Initialize from query params if they exist
    const appUrl = searchParams.get('appUrl');
    const appId = searchParams.get('appId');
    if (appUrl && appId) {
      // Try to find app name from favorites or featured apps
      const app = [...favoriteApps, ...FEATURED_APPS].find(a => a.id === appId);
      return {
        url: appUrl,
        id: appId,
        name: app?.appName || ''
      };
    }
    return null;
  });

  // State for generated app
  const [generatedApp, setGeneratedApp] = useState<{
    htmlContent: string;
    id: string;
    prompt: string;
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

  const handleGeneratedAppClose = () => {
    setGeneratedApp(null);
  };

  const handleGenerateApp = (htmlContent: string, appId: string, prompt: string, appName: string) => {
    setGeneratedApp({
      htmlContent,
      id: appId,
      prompt,
      name: appName
    });
  };

  const handleGeneratedAppUpdate = (app: GeneratedApp) => {
    setGeneratedApp({
      htmlContent: app.htmlContent,
      id: app.id,
      prompt: app.prompt,
      name: app.name
    });
    
    // Refresh the apps list
    refreshApps();
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
          <GeneratedAppsGrid
            onAppSelect={(htmlContent, id, prompt, name) => {
              handleGenerateApp(htmlContent, id, prompt, name);
            }}
          />
        </div>
      </div>
      
      {/* Generate App FAB */}
      <GenerateAppFab onGenerateApp={handleGenerateApp} />
      
      {/* Regular Mini App Modal */}
      <MiniAppModal
        isOpen={!!selectedApp}
        onClose={handleModalClose}
        appUrl={selectedApp?.url || null}
        appId={selectedApp?.id || ""}
        appName={selectedApp?.name}
      />
      
      {/* Generated App Modal */}
      <GeneratedAppModal
        isOpen={!!generatedApp}
        onClose={handleGeneratedAppClose}
        htmlContent={generatedApp?.htmlContent || ""}
        appId={generatedApp?.id || ""}
        appName={generatedApp?.name || ""}
        prompt={generatedApp?.prompt || ""}
        onUpdate={handleGeneratedAppUpdate}
      />
      
      <BottomNav />
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] bg-[#f8faf9] flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
