"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import TopBar from "@/components/organisms/TopBar";
import { useEffect, useState } from "react";
import { Fab } from "@/components/ui/fab";
import { IHostMethodHandlers } from "@apna/sdk";
import { FollowNpub, UnfollowNpub, PublishNote, UpdateProfile, SubscribeToFeed,
  SubscribeToNotifications, RepostNote, ReactToNote, ReplyToNote, GetNpubProfile,
  GetNpubProfileMetadata, GetNote, GetNoteReplies, GetFeed } from "@/lib/nostr";
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
    getAvailableUserProfiles() {
      const profiles = getAllUserProfilesFromLocalStorage();
      if (profiles.length === 0) return [];
      return Promise.all(profiles.map((profile: IUserKeyPair) => GetNpubProfile(profile.npub)));
    },
    switchUserProfile(npub) {
      const profile = getUserProfileByNpub(npub);
      if (!profile) {
        throw new Error(`Profile with npub ${npub} not found`);
      }
      
      // Set as active profile
      setActiveUserProfile(npub);
      
      return GetNpubProfile(npub);
    },
    fetchUserMetadata(npub) {
      return GetNpubProfileMetadata(npub)
    },
    updateProfileMetadata(profile) {
      const existingKeyPair = getKeyPairFromLocalStorage();
      if (!existingKeyPair) {
        throw new Error("No active user profile found");
      }
      return UpdateProfile(profile, existingKeyPair.nsec);
    },
    fetchUserProfile(npub) {
      return GetNpubProfile(npub)
    },
    followUser(npub) {
      const existingKeyPair = getKeyPairFromLocalStorage();
      if (!existingKeyPair) {
        throw new Error("No active user profile found");
      }
      return FollowNpub(npub, existingKeyPair.nsec);
    },
    unfollowUser(npub) {
      const existingKeyPair = getKeyPairFromLocalStorage();
      if (!existingKeyPair) {
        throw new Error("No active user profile found");
      }
      return UnfollowNpub(npub, existingKeyPair.nsec);
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
      return PublishNote(content, existingKeyPair.nsec);
    },
    repostNote(noteId, quoteContent) {
      const existingKeyPair = getKeyPairFromLocalStorage();
      if (!existingKeyPair) {
        throw new Error("No active user profile found");
      }
      return RepostNote(noteId, quoteContent, existingKeyPair.nsec);
    },
    likeNote(noteId) {
      const existingKeyPair = getKeyPairFromLocalStorage();
      if (!existingKeyPair) {
        throw new Error("No active user profile found");
      }
      return ReactToNote(noteId, existingKeyPair.nsec);
    },
    replyToNote(noteId, content) {
      const existingKeyPair = getKeyPairFromLocalStorage();
      if (!existingKeyPair) {
        throw new Error("No active user profile found");
      }
      return ReplyToNote(noteId, content, existingKeyPair.nsec);
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
  appUrl: string | null;
  appId: string;
  appName?: string;
  onClose: () => void;
}

export default function MiniAppModal({ isOpen, appUrl, appId, appName, onClose }: MiniAppModalProps) {
  const [apnaHost, setApnaHost] = useState<ApnaHost>();
  const [isFullscreen, setIsFullscreen] = useState(true);

  useEffect(() => {
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
        setApnaHost(apna)
      }
      init()
    }
  }, [isOpen]);

  return isOpen ? (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
            {appUrl && (
              <iframe
                id="miniAppIframe"
                src={appUrl}
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
                  iframe.src = iframe.src;
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
  ) : null;
}