"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import TopBar from "@/components/organisms/TopBar";
import { useEffect, useState } from "react";
import { Fab } from "@/components/ui/fab";
import { ApnaHost } from '@apna/sdk';
import { useGeneratedApps } from "@/lib/contexts/GeneratedAppsContext";
import { GeneratedApp, ChatMessage } from "@/lib/generatedAppsDB";
import PromptIterationSheet from "@/components/molecules/PromptIterationSheet";
import { callOpenRouterApi } from "@/lib/utils/openRouterApi";
import { useOpenRouteApiKey } from "@/lib/hooks/useOpenRouteApiKey";
import { methodHandlers } from "@/lib/nostr/method-handlers";

interface GeneratedAppModalProps {
  isOpen: boolean;
  htmlContent: string;
  appId: string;
  appName?: string;
  messages?: ChatMessage[];
  onClose: () => void;
  onUpdate?: (app: GeneratedApp) => void;
}

export default function GeneratedAppModal({
  isOpen,
  htmlContent,
  appId,
  appName,
  messages = [],
  onClose,
  onUpdate
}: GeneratedAppModalProps) {
  const [apnaHost, setApnaHost] = useState<ApnaHost>();
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [isIterationSheetOpen, setIsIterationSheetOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { getApp, updateApp, refreshApps } = useGeneratedApps();
  const { apiKey } = useOpenRouteApiKey();

  // We don't need to load app data anymore since we're not editing the prompt directly

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

  const handleRegenerateContent = async (newMessage: string) => {
    if (!newMessage.trim()) return;
    
    setIsRegenerating(true);
    try {
      // Create a new user message
      const userMessage: ChatMessage = {
        role: 'user',
        content: newMessage.trim()
      };
      
      // Add the new message to the existing messages
      // Preserve any system message at the beginning
      let updatedMessages = [];
      
      // If the first message is a system message, keep it at the beginning
      if (messages.length > 0 && messages[0].role === 'system') {
        updatedMessages = [
          messages[0],
          ...messages.slice(1),
          userMessage
        ];
      } else {
        updatedMessages = [...messages, userMessage];
      }
      
      if (!apiKey) {
        throw new Error("OpenRouter API key is not provided. Please add your API key in the settings.");
      }

      // Call the OpenRouter API directly using the client-side utility
      const data = await callOpenRouterApi({
        messages: updatedMessages,
        apiKey
      });
      
      if (data.html && data.messages) {
        // Get the latest HTML content
        const htmlContent = data.html;
        
        // Get all previous HTML contents from the app
        const app = await getApp(appId);
        const htmlContents = app?.htmlContents || [];
        
        // Create the updated app object
        const updatedApp: GeneratedApp = {
          id: appId,
          htmlContent: data.html,
          htmlContents: [...htmlContents, data.html],
          messages: data.messages,
          name: appName || "Generated App",
          createdAt: app?.createdAt || Date.now(),
          updatedAt: Date.now()
        };
        
        // Update the app in the database
        await updateApp(appId, {
          htmlContent: data.html,
          htmlContents: [...htmlContents, data.html],
          messages: data.messages,
          name: appName || "Generated App"
        });
        
        // Explicitly refresh the apps list to ensure the UI updates
        await refreshApps();
        
        // Notify parent component
        if (onUpdate) {
          onUpdate(updatedApp);
        }
      }
    } catch (error) {
      console.error("Error regenerating content:", error);
    } finally {
      setIsRegenerating(false);
      setIsIterationSheetOpen(false);
    }
  };

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
              appName={appName || "Generated App"}
              onClose={onClose}
              showBackButton
            />
          )}
          <div className="flex-1">
            {htmlContent && isOpen && (
              <iframe
                id="generatedAppIframe"
                srcDoc={htmlContent}
                style={{
                  overflow: "hidden",
                  height: "100%",
                  width: "100%",
                  border: "none"
                }}
                height="100%"
                width="100%"
                allow="camera"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            )}
            <Fab
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
              appId={appId}
              onToggleHighlight={() => {
                apnaHost?.sendMessage(document.getElementById('generatedAppIframe'), "superapp:message", {type: "customise:toggleHighlight"})
              }}
              onClose={onClose}
              isGeneratedApp={true}
              onIterate={() => setIsIterationSheetOpen(true)}
            />
            
            {/* Prompt Iteration Sheet */}
            <PromptIterationSheet
              isOpen={isIterationSheetOpen}
              onClose={() => setIsIterationSheetOpen(false)}
              messages={messages}
              onSubmit={handleRegenerateContent}
              isLoading={isRegenerating}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}