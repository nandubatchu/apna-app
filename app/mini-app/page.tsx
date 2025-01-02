"use client";

import { FollowNpub, UnfollowNpub, PublishNote, UpdateProfile, SubscribeToFeed, SubscribeToNotifications, RepostNote, LikeNote, ReplyToNote, GetNpubProfile, GetNpubProfileMetadata, GetNote, GetNoteReplies } from "@/lib/nostr";
import { getKeyPairFromLocalStorage } from "@/lib/utils";
import { useEffect, useState, useCallback } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { IHostMethodHandlers } from "@apna/sdk";

// Methods
const methodHandlers: IHostMethodHandlers = {
  nostr: {
    getActiveUserProfile() {
      const existingKeyPair = getKeyPairFromLocalStorage();
      return GetNpubProfile(existingKeyPair!.npub)
    },
    fetchUserMetadata(npub) {
      const existingKeyPair = getKeyPairFromLocalStorage();
      return GetNpubProfileMetadata(existingKeyPair!.npub)
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
      return LikeNote(noteId, existingKeyPair!.nsec);
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
    // subscribeToUserNotifications(onevent) {
      
    // },
  }
}

// Page
export default function PageComponent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [iframeSrc, setIframeSrc] = useState<string>();
  useEffect(() => {
    if (typeof window !== "undefined") {
      const init = async () => {
        const { ApnaHost } = (await import('@apna/sdk'))
        
        // @ts-ignore
        window.methodHandlers = methodHandlers
        const apna = new ApnaHost({
          methodHandlers
        })
        
        if (searchParams.get('miniAppUrl') === null) {
          router.push(pathname + '?' + createQueryString('miniAppUrl', 1==1 ? 'https://social-mini-app.vercel.app/' : 'http://localhost:3001'))
        }
        // setIframeSrc("http://localhost:3001")
      }
      init()
    }

  }, []);

  // Get a new searchParams string by merging the current
  // searchParams with a provided key/value pair
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)
 
      return params.toString()
    },
    [searchParams]
  )

  return (
    <div className="h-screen w-screen">
      <iframe id="miniAppIframe" src={searchParams.get('miniAppUrl') || ""} style={{ overflow: "hidden", height: "100%", width: "100%" }} height="100%" width="100%"></iframe>
    </div>
  );
}
