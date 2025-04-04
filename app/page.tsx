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
import { GeneratedApp, ChatMessage } from '@/lib/generatedAppsDB';

function HomeContent() {
  const { loading: profileLoading, error: profileError } = useProfile();
  const { favoriteApps } = useFavorites();
  const { refreshApps } = useGeneratedApps();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedApp, setSelectedApp] = useState<{
    url?: string;
    id: string;
    name: string;
    isGeneratedApp?: boolean;
    htmlContent?: string;
  } | null>(() => {
    // Initialize from query params if they exist
    const appUrl = searchParams.get('appUrl');
    const appId = searchParams.get('appId');
    const isGenerated = searchParams.get('isGenerated') === 'true';
    
    if (appId) {
      // Try to find app from favorites or featured apps
      const app = [...favoriteApps, ...FEATURED_APPS].find(a => a.id === appId);
      
      if (isGenerated && app) {
        // Check if app is from favoriteApps (has isGeneratedApp property)
        const isFromFavorites = 'isGeneratedApp' in app;
        
        return {
          id: appId,
          name: app.appName || '',
          isGeneratedApp: true,
          // Only access htmlContent if the app is from favoriteApps
          htmlContent: isFromFavorites && 'htmlContent' in app ? app.htmlContent || '' : ''
        };
      } else if (appUrl) {
        return {
          url: appUrl,
          id: appId,
          name: app?.appName || ''
        };
      }
    }
    return null;
  });

  // State for generated app
  const [generatedApp, setGeneratedApp] = useState<{
    htmlContent: string;
    id: string;
    messages: ChatMessage[];
    name: string;
  } | null>(null);

  const handleAppSelect = (appURL: string | null, appId: string, appName: string, isGeneratedApp: boolean = false) => {
    // Update URL with query params
    const params = new URLSearchParams();
    params.set('appId', appId);
    
    if (isGeneratedApp) {
      // For generated apps
      params.set('isGenerated', 'true');
      
      // Find the app in favoriteApps to get the htmlContent
      const app = favoriteApps.find(a => a.id === appId);
      
      // Check if app is from favoriteApps and has isGeneratedApp property
      const isGeneratedAppWithContent = app && 'isGeneratedApp' in app && 'htmlContent' in app;
      
      setSelectedApp({
        id: appId,
        name: appName,
        isGeneratedApp: true,
        // Only access htmlContent if the app is a generated app with content
        htmlContent: isGeneratedAppWithContent ? app.htmlContent || '' : ''
      });
    } else if (appURL) {
      // For external apps
      params.set('appUrl', appURL);
      params.set('isGenerated', 'false');
      
      setSelectedApp({
        url: appURL,
        id: appId,
        name: appName
      });
    }
    
    router.push(`/?${params.toString()}`);
  };

  const handleModalClose = () => {
    // Remove query params when closing
    router.push('/');
    setSelectedApp(null);
  };

  const handleGeneratedAppClose = () => {
    setGeneratedApp(null);
  };

  const handleGenerateApp = (htmlContent: string, appId: string, messages: ChatMessage[], appName: string) => {
    setGeneratedApp({
      htmlContent,
      id: appId,
      messages,
      name: appName
    });
  };

  const handleGeneratedAppUpdate = (app: GeneratedApp) => {
    setGeneratedApp({
      htmlContent: app.htmlContent,
      id: app.id,
      messages: app.messages,
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
                // Featured apps are always external
                handleAppSelect(url, id, app.appName, false);
              }
            }}
          />
          <FavoriteAppsGrid
            onAppSelect={(url, id) => {
              const app = favoriteApps.find(a => a.id === id);
              if (app) {
                // Check if this is a generated app
                const isGenerated = 'isGeneratedApp' in app && app.isGeneratedApp === true;
                handleAppSelect(url, id, app.appName, isGenerated);
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
      
      {/* Mini App Modal - handles both external and generated apps */}
      <MiniAppModal
        isOpen={!!selectedApp}
        onClose={handleModalClose}
        appUrl={selectedApp?.url || null}
        appId={selectedApp?.id || ""}
        appName={selectedApp?.name}
        isGeneratedApp={selectedApp?.isGeneratedApp || false}
        htmlContent={selectedApp?.htmlContent || null}
      />
      
      {/* Generated App Modal */}
      <GeneratedAppModal
        isOpen={!!generatedApp}
        onClose={handleGeneratedAppClose}
        htmlContent={generatedApp?.htmlContent || ""}
        appId={generatedApp?.id || ""}
        appName={generatedApp?.name || ""}
        messages={generatedApp?.messages || []}
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
