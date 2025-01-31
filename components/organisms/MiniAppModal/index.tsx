"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import TopBar from "@/components/organisms/TopBar";
import { useEffect, useState } from "react";
import { Fab } from "@/components/ui/fab";
import { IHostMethodHandlers } from "@apna/sdk";
import { FollowNpub, UnfollowNpub, PublishNote, UpdateProfile, SubscribeToFeed, 
  SubscribeToNotifications, RepostNote, ReactToNote, ReplyToNote, GetNpubProfile, 
  GetNpubProfileMetadata, GetNote, GetNoteReplies, GetFeed } from "@/lib/nostr";
import { getKeyPairFromLocalStorage } from "@/lib/utils";

// Method handlers from the original mini-app page
const methodHandlers: IHostMethodHandlers = {
  nostr: {
    getActiveUserProfile() {
      const existingKeyPair = getKeyPairFromLocalStorage();
      return GetNpubProfile(existingKeyPair!.npub)
    },
    fetchUserMetadata(npub) {
      return GetNpubProfileMetadata(npub)
    },
    updateProfileMetadata(profile) {
      const existingKeyPair = getKeyPairFromLocalStorage();
      return UpdateProfile(profile, existingKeyPair!.nsec);
    },
    fetchUserProfile(npub) {
      return GetNpubProfile(npub)
    },
    followUser(npub) {
      const existingKeyPair = getKeyPairFromLocalStorage();
      return FollowNpub(npub, existingKeyPair!.nsec);
    },
    unfollowUser(npub) {
      const existingKeyPair = getKeyPairFromLocalStorage();
      return UnfollowNpub(npub, existingKeyPair!.nsec);
    },
    fetchNote(noteId, returnReactions) {
      return GetNote(noteId)
    },
    async fetchNoteAndReplies(noteId, returnReactions) {
      return {
        note: await GetNote(noteId),
        replyNotes: await GetNoteReplies(noteId)
      }
    },
    publishNote(content) {
      const existingKeyPair = getKeyPairFromLocalStorage();
      return PublishNote(content, existingKeyPair!.nsec);
    },
    repostNote(noteId, quoteContent) {
      const existingKeyPair = getKeyPairFromLocalStorage();
      return RepostNote(noteId, quoteContent, existingKeyPair!.nsec);
    },
    likeNote(noteId) {
      const existingKeyPair = getKeyPairFromLocalStorage();
      return ReactToNote(noteId, existingKeyPair!.nsec);
    },
    replyToNote(noteId, content) {
      const existingKeyPair = getKeyPairFromLocalStorage();
      return ReplyToNote(noteId, content, existingKeyPair!.nsec);
    },
    subscribeToFeed(feedType, onevent, withReactions) {
      const existingKeyPair = getKeyPairFromLocalStorage();
      return SubscribeToFeed(existingKeyPair!.npub, feedType, onevent);
    },
    subscribeToUserFeed(npub, feedType, onevent, withReactions) {
      return SubscribeToFeed(npub, feedType, onevent);
    },
    fetchFeed(feedType, since, until, limit) {
      const existingKeyPair = getKeyPairFromLocalStorage();
      return GetFeed(existingKeyPair!.npub, feedType, since, until, limit);
    },
    fetchUserFeed(npub, feedType, since, until, limit) {
      return GetFeed(npub, feedType, since, until, limit);
    },
    subscribeToUserNotifications(onevent) {
      const existingKeyPair = getKeyPairFromLocalStorage();
      return SubscribeToNotifications(onevent, existingKeyPair!.npub);
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
              onClose={onClose}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  ) : null;
}