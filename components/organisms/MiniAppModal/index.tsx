"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import TopBar from "@/components/organisms/TopBar";
import { useEffect, useState } from "react";
import { Fab } from "@/components/ui/fab";
import { IHostMethodHandlers } from "@apna/sdk";
import { FollowNpub, UnfollowNpub, PublishNote, UpdateProfile, SubscribeToFeed,
  SubscribeToNotifications, RepostNote, ReactToNote, ReplyToNote, GetNpubProfile,
  GetNpubProfileMetadata, GetNote, GetNoteReplies, GetFeed, GetNoteReactions, GetNoteReposts } from "@/lib/nostr";
import { publishEvent } from "@/lib/nostr/events";
import {
  getKeyPairFromLocalStorage,
  getAllUserProfilesFromLocalStorage,
  getUserProfileByNpub,
  setActiveUserProfile,
  IUserKeyPair
} from "@/lib/utils";
import { ApnaHost } from '@apna/sdk';

// Method handlers from the original mini-app page
const methodHandlers: IHostMethodHandlers = {
  nostr: {
    getActiveUserProfile() {
      const existingKeyPair = getKeyPairFromLocalStorage();
      // If no keypair exists, create a default one or throw an error
      if (!existingKeyPair) {
        throw new Error("No active user profile found");
      }
      return GetNpubProfile(existingKeyPair.npub);
    },
    fetchUserMetadata(npub) {
      return GetNpubProfileMetadata(npub)
    },
    async updateProfileMetadata(profile) {
      const existingKeyPair = getKeyPairFromLocalStorage();
      if (!existingKeyPair) {
        throw new Error("No active user profile found");
      }
      
      // Use publishEvent which handles both local and remote signer profiles
      if (existingKeyPair.isRemoteSigner) {
        // For remote signer, use npub
        return UpdateProfile(profile, existingKeyPair.npub);
      } else {
        // For local key, use nsec
        return UpdateProfile(profile, existingKeyPair.nsec);
      }
    },
    fetchUserProfile(npub) {
      return GetNpubProfile(npub)
    },
    followUser(npub) {
      const existingKeyPair = getKeyPairFromLocalStorage();
      if (!existingKeyPair) {
        throw new Error("No active user profile found");
      }
      
      // Use the appropriate key based on profile type
      if (existingKeyPair.isRemoteSigner) {
        // For remote signer, use npub
        return FollowNpub(npub, existingKeyPair.npub);
      } else {
        // For local key, use nsec
        return FollowNpub(npub, existingKeyPair.nsec);
      }
    },
    unfollowUser(npub) {
      const existingKeyPair = getKeyPairFromLocalStorage();
      if (!existingKeyPair) {
        throw new Error("No active user profile found");
      }
      
      // Use the appropriate key based on profile type
      if (existingKeyPair.isRemoteSigner) {
        // For remote signer, use npub
        return UnfollowNpub(npub, existingKeyPair.npub);
      } else {
        // For local key, use nsec
        return UnfollowNpub(npub, existingKeyPair.nsec);
      }
    },
    fetchNote(noteId, returnReactions) {
      return GetNote(noteId)
    },
    async fetchNoteAndReplies(noteId, returnReactions) {
      const [ note, replyNotes ] = await Promise.all([
        GetNote(noteId),
        GetNoteReplies(noteId)
      ]);
      return { note, replyNotes }
    },
    publishNote(content) {
      const existingKeyPair = getKeyPairFromLocalStorage();
      if (!existingKeyPair) {
        throw new Error("No active user profile found");
      }
      
      // Use the appropriate key based on profile type
      if (existingKeyPair.isRemoteSigner) {
        // For remote signer, use npub
        return PublishNote(content, existingKeyPair.npub);
      } else {
        // For local key, use nsec
        return PublishNote(content, existingKeyPair.nsec);
      }
    },
    repostNote(noteId, quoteContent) {
      const existingKeyPair = getKeyPairFromLocalStorage();
      if (!existingKeyPair) {
        throw new Error("No active user profile found");
      }
      
      // Use the appropriate key based on profile type
      if (existingKeyPair.isRemoteSigner) {
        // For remote signer, use npub
        return RepostNote(noteId, quoteContent, existingKeyPair.npub);
      } else {
        // For local key, use nsec
        return RepostNote(noteId, quoteContent, existingKeyPair.nsec);
      }
    },
    likeNote(noteId) {
      const existingKeyPair = getKeyPairFromLocalStorage();
      if (!existingKeyPair) {
        throw new Error("No active user profile found");
      }
      
      // Use the appropriate key based on profile type
      if (existingKeyPair.isRemoteSigner) {
        // For remote signer, use npub
        return ReactToNote(noteId, existingKeyPair.npub);
      } else {
        // For local key, use nsec
        return ReactToNote(noteId, existingKeyPair.nsec);
      }
    },
    replyToNote(noteId, content) {
      const existingKeyPair = getKeyPairFromLocalStorage();
      if (!existingKeyPair) {
        throw new Error("No active user profile found");
      }
      
      // Use the appropriate key based on profile type
      if (existingKeyPair.isRemoteSigner) {
        // For remote signer, use npub
        return ReplyToNote(noteId, content, existingKeyPair.npub);
      } else {
        // For local key, use nsec
        return ReplyToNote(noteId, content, existingKeyPair.nsec);
      }
    },
    subscribeToFeed(feedType, onevent, withReactions) {
      const existingKeyPair = getKeyPairFromLocalStorage();
      if (!existingKeyPair) {
        throw new Error("No active user profile found");
      }
      return SubscribeToFeed(existingKeyPair.npub, feedType, onevent);
    },
    subscribeToUserFeed(npub, feedType, onevent, withReactions) {
      return SubscribeToFeed(npub, feedType, onevent);
    },
    fetchFeed(feedType, since, until, limit) {
      const existingKeyPair = getKeyPairFromLocalStorage();
      if (!existingKeyPair) {
        throw new Error("No active user profile found");
      }
      return GetFeed(existingKeyPair.npub, feedType, since, until, limit);
    },
    fetchUserFeed(npub, feedType, since, until, limit) {
      return GetFeed(npub, feedType, since, until, limit);
    },
    fetchNoteLikes(noteId, since) {
      return GetNoteReactions(noteId, true, since);
    },
    fetchNoteReposts(noteId, since) {
      return GetNoteReposts(noteId, true, since);
    },
    subscribeToUserNotifications(onevent) {
      const existingKeyPair = getKeyPairFromLocalStorage();
      if (!existingKeyPair) {
        throw new Error("No active user profile found");
      }
      return SubscribeToNotifications(onevent, existingKeyPair.npub);
    }
  }
}

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