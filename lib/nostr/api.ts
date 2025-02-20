import { Event as NostrEvent, Filter, getPublicKey } from 'nostr-tools'
import * as nip19 from 'nostr-tools/nip19'
import { fetchFromRelay, fetchAllFromRelay, fetchAllFromAPI, subscribeToEvents, filterTagValues, DEFAULT_RELAYS, pool } from './core'
import { publishKind0, publishKind1, publishKind3, publishKind6, publishKind7, GenerateKeyPair } from './events'
import * as crypto from 'crypto'

export const InitialiseProfile = async (nsec: string) => {
    let nprofile = nip19.nprofileEncode({ 
        pubkey: getPublicKey(nip19.decode(nsec).data as Uint8Array), 
        relays: DEFAULT_RELAYS 
    })
    let metadata = {
        name: crypto.randomBytes(10).toString('hex').slice(0, 10),
        about: "Bitcoin Enthusiast"
    }
    await publishKind0(nsec, metadata)
    
    // Add individual tags for each relay
    const relayTags = DEFAULT_RELAYS.map(relay => ['r', relay, 'read', 'write'])
    await publishKind3(nsec, relayTags)
    
    let profile = {
        nprofile,
        metadata
    }
    return profile
}

export const FollowNpub = async (npub: string, nsec: string) => {
    const pubkey = npub.includes("npub") ? nip19.decode(npub).data as string : npub
    const existingContacts = await fetchFromRelay({
        kinds: [3],
        authors: [getPublicKey(nip19.decode(nsec).data as Uint8Array)]
    })
    console.log(existingContacts)
    let newTags = []
    if (existingContacts) {
        newTags.push(...existingContacts.tags, ["p", pubkey])
        newTags = Array.from(
            new Set(newTags.map((item) => JSON.stringify(item)))
          ).map((json) => JSON.parse(json));
    } else {
        newTags.push(["p", pubkey])
    }
    
    return publishKind3(nsec, newTags)
}

export const UnfollowNpub = async (npub: string, nsec: string) => {
    const existingContacts = await fetchFromRelay({
        kinds: [3],
        authors: [getPublicKey(nip19.decode(nsec).data as Uint8Array)]
    })
    console.log(existingContacts)
    if (!existingContacts) {
        return
    } 
    const newTags = existingContacts.tags.filter(item => item[1] !== nip19.decode(npub).data as string);
    
    return publishKind3(nsec, newTags)
}

export const PublishNote = async (content: any, nsec: string) => {
    return publishKind1(nsec, content)
}

export const RepostNote = async (noteId: string, quoteContent: string, nsec: string) => {
    const noteIdRaw = noteId.includes("note1") ? nip19.decode(noteId).data as string : noteId
    const note: any = await fetchFromRelay({
        ids: [noteIdRaw]
    })

    if (quoteContent) {
        const content = quoteContent
        const tags = [
            ['e', note.id, "", "mention"],
            ['p', note.pubkey, "", "mention"],
            ['q', note.id]
        ]
        return publishKind1(nsec, `${content}\nnostr:${nip19.noteEncode(note.id)}`, tags)
    } else {
        const content = JSON.stringify(note)
        const tags = [
            ['e', note.id],
            ['p', note.pubkey],
        ]
        return publishKind6(nsec, content, tags)
    }
}

export const ReactToNote = async (noteId: string, nsec: string, content: string = "+") => {
    const noteIdRaw = noteId.includes("note1") ? nip19.decode(noteId).data as string : noteId
    const note: any = await fetchFromRelay({
        ids: [noteIdRaw]
    })
    const tags = [
        ['e', note.id],
        ['p', note.pubkey],
    ]
    return publishKind7(nsec, tags, content)
}

export const ReplyToNote = async (noteId: string, content: string, nsec: string) => {
    const noteIdRaw = noteId.includes("note1") ? nip19.decode(noteId).data as string : noteId
    const note: any = await fetchFromRelay({
        ids: [noteIdRaw]
    })
    const eTags: string[][] = note.tags.filter((t: string[]) => t[0] === "e");
    const tags = [
        ...eTags,
        ['e', note.id, "", eTags.length > 0 ? "reply" : "root"],
        ['p', note.pubkey],
    ]
    return publishKind1(nsec, content, tags)
}

export const UpdateProfile = async (profileMetadata: any, nsec: string) => {
    const npub = getPublicKey(nip19.decode(nsec).data as Uint8Array)
    const [ nprofile, metadata, following, followers ] = await Promise.all([
        getNprofile(npub),
        publishKind0(nsec, profileMetadata).then((event) => JSON.parse(event.content)),
        getFollowing(npub),
        getFollowers(npub)
    ]);
    
    return {
        nprofile,
        metadata,
        followers,
        following
    }
}

export const SubscribeToFeed = async (npub: string, feedType: string, callback: (note: NostrEvent) => void) => {
    const pubkey = nip19.decode(npub).data as string
    
    switch (feedType) {
        case "FOLLOWING_FEED": {
            const existingContacts = await fetchFromRelay({
                kinds: [3],
                authors: [pubkey]
            })
            console.log(existingContacts)
            if (!existingContacts) {
                return
            } 
            const followingAuthors = filterTagValues(existingContacts.tags, "p")
            await subscribeToEvents({
                kinds: [1],
                authors: followingAuthors
            }, callback)
            break;
        }

        case "NOTES_FEED":
            await subscribeToEvents({
                kinds: [1],
                authors: [pubkey]
            }, callback)
            break;
    
        default:
            break;
    }
}

export const SubscribeToNotifications = async (callback: (note: NostrEvent) => void, npub: string) => {
    await subscribeToEvents({
        kinds: [1],
        authors: []
    }, callback)
}

export const GetNoteReplies = async (noteId: string, direct: boolean = false) => {
    const noteIdRaw = noteId.includes("note1") ? nip19.decode(noteId).data as string : noteId
    const replies = await fetchAllFromAPI({
        kinds: [1],
        "#e": [noteIdRaw]
    }, false, [noteIdRaw]);

    if (direct) {
        // Filter for direct replies only - where the last "e" tag marked "reply" matches the note ID
        return replies.filter((reply: NostrEvent) => {
            const eTags = reply.tags.filter(tag => tag[0] === "e");
            const lastReplyTag = eTags.findLast(tag => tag[3] === "reply");
            return lastReplyTag && lastReplyTag[1] === noteIdRaw || eTags.length === 1;
        });
    }
    return replies;
}

export const GetNoteZaps = async (noteId: string) => {
    const noteIdRaw = noteId.includes("note1") ? nip19.decode(noteId).data as string : noteId
    const filter: Filter = {
        kinds: [9735],
        "#e": [noteIdRaw]
    }
    return (await fetchAllFromRelay(filter)) as (NostrEvent & {kind:9735})[]
}

const getNprofile = async (npub: string) => {
    const pubkey = npub.includes("npub") ? nip19.decode(npub).data as string : npub
    const config = await fetchAllFromAPI({
        kinds: [3],
        authors: [pubkey]
    }, undefined, undefined, true)
   
    let relays = DEFAULT_RELAYS
    if (config) {
        const configRelays = filterTagValues(config.tags, "r")
        relays = configRelays.length > 0 ? configRelays : DEFAULT_RELAYS
    }
    return nip19.nprofileEncode({ pubkey, relays })
}

export const GetNpubProfileMetadata = async (npub: string) => {
    const pubkey = npub.includes("npub") ? nip19.decode(npub).data as string : npub
    const metadataContent = await fetchAllFromAPI({
        kinds: [0],
        authors: [pubkey]
    }, false, [pubkey])
    return JSON.parse(metadataContent[0].content || {})
}

export const GetNote = async (noteId: string) => {
    const noteIdRaw = noteId.includes("note1") ? nip19.decode(noteId).data as string : noteId
    return (await fetchAllFromAPI({
        ids: [noteIdRaw]
    }, undefined, undefined, true)) as NostrEvent & {kind: 1}
}

const getFollowing = async (npub: string): Promise<string[]> => {
    const pubkey = npub.includes("npub") ? nip19.decode(npub).data as string : npub
    const following = await fetchAllFromAPI({
        kinds: [3],
        authors: [pubkey]
    }, undefined, undefined, true)
    return following ? filterTagValues(following.tags, "p") : []
}   

const getFollowers = async (npub: string): Promise<string[]> => {
    const pubkey = npub.includes("npub") ? nip19.decode(npub).data as string : npub
    const filter: Filter = {
        kinds: [3],
        "#p": [pubkey]
    }
    const followers = await fetchAllFromAPI(filter, false, [pubkey])
    return followers.map((e: any) => e.pubkey)
}

export const GetNpubProfile = async (npub: string) => {
    const [ nprofile, metadata, following, followers ] = await Promise.all([
        getNprofile(npub),
        GetNpubProfileMetadata(npub),
        getFollowing(npub),
        getFollowers(npub)
    ]);

    return {
        nprofile,
        metadata,
        followers,
        following
    }
}

export const GetNoteReactions = async (noteId: string, revalidate: boolean=false) => {
    const noteIdRaw = noteId.includes("note1") ? nip19.decode(noteId).data as string : noteId
    return fetchAllFromAPI({
        kinds: [7],
        "#e": [noteIdRaw],
    }, revalidate, [noteIdRaw])
}

export const GetFeed = async (npub: string, feedType: string, since?: number, until?: number, limit?: number) => {
    const authorRaw = npub.includes("npub") ? nip19.decode(npub).data as string : npub
    const baseFilter: Filter = {
        kinds: [1],
        limit: limit || 20
    }
    if (since) baseFilter.since = since;
    if (until) baseFilter.until = until;

    switch (feedType) {
        case "FOLLOWING_FEED": {
            const existingContacts = await fetchFromRelay({
                kinds: [3],
                authors: [authorRaw]
            })
            if (!existingContacts) {                
                return []
            }
            const followingAuthors = filterTagValues(existingContacts.tags, "p")
            return fetchAllFromAPI({
                ...baseFilter,
                authors: followingAuthors
            });
        }
            
        case "NOTES_FEED":
            return fetchAllFromAPI({
                ...baseFilter,
                authors: [authorRaw]
            });
            
        default:
            return [];
    }
}

export const Test = async () => {
    const pubkey = nip19.decode("npub1w46mjnagz9f0u556fzva8ypfftc5yfm32n8ygqmd2r32mxw4cfnsvkvy9e").data as string
    console.log('Decoded pubkey:', pubkey)
    
    const filter: Filter = {
        kinds: [0, 3],
        authors: [pubkey]
    }
    
    const events = await pool.querySync(DEFAULT_RELAYS, filter, {
        maxWait: 2000
    })
    
    events.forEach(event => {
        console.log('## got event:', event)
    })
    
    return events
}

// Re-export everything from events
export { GenerateKeyPair } from './events'