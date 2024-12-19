"use client";

// import Home from "@/components/templates/home";
import Social from "@/components/templates/Social";
import { GenerateKeyPair, InitialiseProfile, Test, FollowNpub, UnfollowNpub, PublishNote, UpdateProfile, SubscribeToFeed, SubscribeToNotifications } from "@/lib/nostr";
import { getKeyPairFromLocalStorage, saveKeyPairToLocalStorage, getProfileFromLocalStorage, saveProfileToLocalStorage } from "@/lib/utils";
import { useEffect, useState, useCallback } from "react";
import { SimplePool, Event } from "nostr-tools";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

// import { ApnaHost } from "@apna/sdk";


const initialiseKeyPair = () => {
  // find the keys in local storage
  const existingKeyPair = getKeyPairFromLocalStorage();
  // if not found generate and set to local storage
  if (!existingKeyPair) {
    const { nsec, npub } = GenerateKeyPair();
    saveKeyPairToLocalStorage(npub, nsec);
  }
};

const initialiseProfile = async () => {
  // find the keys in local storage
  const existingProfile = getProfileFromLocalStorage();
  // if not found publish and set to local storage
  if (!existingProfile) {
    initialiseKeyPair();
    const existingKeyPair = getKeyPairFromLocalStorage();
    const profile = await InitialiseProfile(existingKeyPair!.nsec);
    saveProfileToLocalStorage(profile);
  }
}

// Methods
const methodHandlers = {
  // getPublicKey: () => {
  //   const existingKeyPair = getKeyPairFromLocalStorage();
  //   return existingKeyPair!.npub
  // },
  nostr: {
    getProfile: () => {
      let profile = getProfileFromLocalStorage();
      return profile!
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
      return SubscribeToFeed(feedType, callback, existingKeyPair!.npub);
    },
    subscribeToNotifications: async (callback: (note: any) => void) => {
      const existingKeyPair = getKeyPairFromLocalStorage();
      return SubscribeToNotifications(callback, existingKeyPair!.npub);
    }
    // subscribeToEvents: (filters: any[], onevent: (event: any) => void) => {
    //   const pool = new SimplePool();
    //   const RELAYS = ["wss://relay.damus.io"];
    //   const sub = pool.subscribeMany(
    //     RELAYS,
    //     [
    //       {
    //         kinds: [1],
    //         limit: 10,
    //       },
    //     ],
    //     {
    //       onevent(evt) {
    //         onevent(evt)
    //       },
    //     }
    //   );
    //   onevent({"content": "valuable content"})
    //   setTimeout(() => {
    //     onevent({"content": "valuable content 2"})
    //   }, 5000);
    // }
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
        
        await initialiseProfile();
        // @ts-ignore
        window.methodHandlers = methodHandlers
        const apna = new ApnaHost({
          methodHandlers
        })
        console.log('initialised')
        if (searchParams.get('miniAppUrl') === null) {
          console.log('he',process.env.NODE_ENV);
          router.push(pathname + '?' + createQueryString('miniAppUrl', 1==1 ? 'https://social-mini-app.vercel.app/' : 'http://localhost:3001'))
        }
        // setIframeSrc("http://localhost:3001")
      }
      init()
    }

    initialiseKeyPair()
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
