import { IHostMethodHandlers, INostr } from "@apna/sdk";
import { 
  FollowNpub, 
  UnfollowNpub, 
  PublishNote, 
  UpdateProfile, 
  SubscribeToFeed,
  SubscribeToNotifications, 
  RepostNote, 
  ReactToNote, 
  ReplyToNote, 
  GetNpubProfile,
  GetNpubProfileMetadata, 
  GetNote, 
  GetNoteReplies, 
  GetFeed, 
  GetNoteReactions, 
  GetNoteReposts,
  encode, 
  decode, 
  fetchEvent, 
  fetchEvents, 
  subscribeToEvents, 
  signAndPublishEvent 
} from "./index";
import { getKeyPairFromLocalStorage } from "@/lib/utils";

/**
 * Shared method handlers for nostr functionality
 * Used by both MiniAppModal and GeneratedAppModal
 */
export const methodHandlers: IHostMethodHandlers = {
  nostr: <INostr>{
    // Low-level APIs
    encode(type, data) {
      return encode(type, data);
    },
    
    decode<Prefix extends keyof any>(nip19String: string) {
      // Cast the result to match the expected return type
      return decode(nip19String) as any;
    },
    
    fetchEvent(eventFilter, relaysOverride) {
      return fetchEvent(eventFilter, relaysOverride);
    },
    
    fetchEvents(eventFilter, relaysOverride) {
      return fetchEvents(eventFilter, relaysOverride);
    },
    
    subscribeToEvents(eventFilter, onevent, relaysOverride) {
      return subscribeToEvents(eventFilter, onevent, relaysOverride);
    },
    
    signAndPublishEvent(event, relaysOverride) {
      return signAndPublishEvent(event, relaysOverride);
    },
    
    // High-level APIs
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
  }
};