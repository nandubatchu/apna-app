"use client";

import { FollowNpub, UnfollowNpub, PublishNote, UpdateProfile, SubscribeToFeed, SubscribeToNotifications, RepostNote, LikeNote, ReplyToNote, GetNpubProfile } from "@/lib/nostr";
import { getKeyPairFromLocalStorage } from "@/lib/utils";
import { useEffect, useState, useCallback } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

// import { ApnaHost } from "@apna/sdk";




// Methods
const methodHandlers = {
  nostr: {
    getProfile: () => {
      const existingKeyPair = getKeyPairFromLocalStorage();
      return GetNpubProfile(existingKeyPair!.npub)
    },
    updateProfile: async (profile: any) => {
      const existingKeyPair = getKeyPairFromLocalStorage();
      return UpdateProfile(profile, existingKeyPair!.nsec);
    },
    followNpub: async (npub: string) => {
      const existingKeyPair = getKeyPairFromLocalStorage();
      return FollowNpub(npub, existingKeyPair!.nsec);
    },
    unfollowNpub: async (npub: string) => {
      const existingKeyPair = getKeyPairFromLocalStorage();
      return UnfollowNpub(npub, existingKeyPair!.nsec);
    },
    publishNote: async (content: string) => {
      const existingKeyPair = getKeyPairFromLocalStorage();
      return PublishNote(content, existingKeyPair!.nsec);
    },
    subscribeToFeed: async (feedType: string, callback: (note: any) => void) => {
      const existingKeyPair = getKeyPairFromLocalStorage();
      return SubscribeToFeed(existingKeyPair!.npub, feedType, callback);
    },
    subscribeToNpubFeed: async (npub: string, feedType: string, callback: (note: any) => void) => {
      return SubscribeToFeed(npub, feedType, callback);
    },
    subscribeToNotifications: async (callback: (note: any) => void) => {
      const existingKeyPair = getKeyPairFromLocalStorage();
      return SubscribeToNotifications(callback, existingKeyPair!.npub);
    },
    repostNote: async (noteId: string, quoteContent: string) => {
      const existingKeyPair = getKeyPairFromLocalStorage();
      return RepostNote(noteId, quoteContent, existingKeyPair!.nsec);
    },
    likeNote: async (noteId: string) => {
      const existingKeyPair = getKeyPairFromLocalStorage();
      return LikeNote(noteId, existingKeyPair!.nsec);
    },
    replyToNote: async (noteId: string, content: string) => {
      const existingKeyPair = getKeyPairFromLocalStorage();
      return ReplyToNote(noteId, content, existingKeyPair!.nsec);
    },
    getNpubProfile: async (npub: string) => {
      return GetNpubProfile(npub)
    }
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
          console.log('he',process.env.NODE_ENV);
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
