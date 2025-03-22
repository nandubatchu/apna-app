"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import TopBar from "@/components/organisms/TopBar";
import { useEffect, useState } from "react";
import { Fab } from "@/components/ui/fab";
import { ApnaHost } from '@apna/sdk';
import { methodHandlers } from "@/lib/nostr/method-handlers";

interface MiniAppModalProps {
  isOpen: boolean;
  appUrl?: string | null;
  htmlContent?: string | null;
  appId: string;
  appName?: string;
  isGeneratedApp?: boolean;
  onClose: () => void;
}

export default function MiniAppModal({
  isOpen,
  appUrl,
  htmlContent,
  appId,
  appName,
  isGeneratedApp = false,
  onClose
}: MiniAppModalProps) {
  const [apnaHost, setApnaHost] = useState<ApnaHost>();
  const [isFullscreen, setIsFullscreen] = useState(true);

  useEffect(() => {
    let apnaInstance: ApnaHost | undefined;
    
    if (typeof window !== "undefined" && isOpen) {
      const init = async () => {
        const { ApnaHost } = (await import('@apna/sdk'))
        
        // @ts-ignore
        window.methodHandlers = methodHandlers
        const apna = new ApnaHost({
          methodHandlers
        })
        // @ts-ignore
        window.apna = apna
        apnaInstance = apna;
        setApnaHost(apna)
      }
      init()
    }
    
    // Cleanup function
    return () => {
      if (!isOpen && typeof window !== "undefined") {
        // Clean up global objects
        // @ts-ignore
        if (window.methodHandlers) delete window.methodHandlers;
        // @ts-ignore
        if (window.apna) delete window.apna;
        
        // Clean up ApnaHost instance
        if (apnaInstance) {
          // @ts-ignore
          if (apnaInstance.cleanup) apnaInstance.cleanup();
          setApnaHost(undefined);
        }
        
        // Force cleanup of any event listeners on the body
        document.body.style.pointerEvents = '';
        document.body.style.overflow = '';
      }
    };
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        // Clean up any resources before closing
        if (typeof window !== "undefined") {
          // @ts-ignore
          delete window.methodHandlers;
          // @ts-ignore
          delete window.apna;
          
          // Force cleanup of any event listeners
          document.body.style.pointerEvents = '';
          document.body.style.overflow = '';
          
          // Remove any aria-hidden attributes
          document.querySelectorAll('[aria-hidden="true"]').forEach((el) => {
            if (el instanceof HTMLElement) {
              el.removeAttribute('aria-hidden');
            }
          });
          
          // Force a reflow to ensure all styles are applied
          document.body.offsetHeight;
        }
        
        // Small delay to ensure cleanup is complete
        setTimeout(() => {
          onClose();
        }, 0);
      }
    }}>
      <DialogContent variant="fullscreen" className="p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {!isFullscreen && (
            <TopBar
              appId={appId}
              appName={appName}
              onClose={onClose}
              showBackButton
            />
          )}
          <div className="flex-1">
            {isOpen && (
              <iframe
                id="miniAppIframe"
                src={!isGeneratedApp && appUrl ? appUrl : undefined}
                srcDoc={isGeneratedApp && htmlContent ? htmlContent : undefined}
                style={{
                  overflow: "hidden",
                  height: "100%",
                  width: "100%",
                  border: "none"
                }}
                height="100%"
                width="100%"
                allow="camera"
              />
            )}
            
            <Fab
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
              appId={appId}
              onRate={() => {
                // Refresh the app to show updated rating
                const iframe = document.getElementById('miniAppIframe') as HTMLIFrameElement;
                if (iframe) {
                  if (!isGeneratedApp && iframe.src) {
                    iframe.src = iframe.src;
                  }
                  // For generated apps, we don't need to refresh
                }
              }}
              onToggleHighlight={() => {
                apnaHost?.sendMessage(document.getElementById('miniAppIframe'), "superapp:message", {type: "customise:toggleHighlight"})
              }}
              onClose={onClose}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}