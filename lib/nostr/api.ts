import { Event as NostrEvent, Filter, getPublicKey } from 'nostr-tools'
import * as nip19 from 'nostr-tools/nip19'
import { subscribeToEvents, filterTagValues, DEFAULT_RELAYS, pool, fetchEventsFromRelays } from './core'
import { normalizeNoteId, normalizePublicKey } from './utils'
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

export const FollowNpub = async (npub: string, nsecOrNpub: string) => {
    const targetPubkey = normalizePublicKey(npub)
    
    // Determine the author pubkey based on whether nsecOrNpub is an nsec or npub
    let authorPubkey: string;
    if (nsecOrNpub.startsWith('npub')) {
        authorPubkey = normalizePublicKey(nsecOrNpub);
    } else {
        authorPubkey = getPublicKey(nip19.decode(nsecOrNpub).data as Uint8Array);
    }
    
    // const existingContacts = await fetchAllFromAPI({
    //     kinds: [3],
    //     authors: [authorPubkey]
    // }, undefined, undefined, true)
    const existingContacts = await fetchEventsFromRelays(DEFAULT_RELAYS, {
        kinds: [3],
        authors: [authorPubkey]
    }, true)
    
    let newTags = []
    if (existingContacts) {
        newTags.push(...existingContacts.tags, ["p", targetPubkey])
        newTags = Array.from(
            new Set(newTags.map((item) => JSON.stringify(item)))
          ).map((json) => JSON.parse(json));
    } else {
        newTags.push(["p", targetPubkey])
    }
    
    return publishKind3(nsecOrNpub, newTags)
}

export const UnfollowNpub = async (npub: string, nsecOrNpub: string) => {
    // Determine the author pubkey based on whether nsecOrNpub is an nsec or npub
    let authorPubkey: string;
    if (nsecOrNpub.startsWith('npub')) {
        authorPubkey = normalizePublicKey(nsecOrNpub);
    } else {
        authorPubkey = getPublicKey(nip19.decode(nsecOrNpub).data as Uint8Array);
    }
    
    // const existingContacts = await fetchAllFromAPI({
    //     kinds: [3],
    //     authors: [authorPubkey]
    // }, undefined, undefined, true)
    const existingContacts = await fetchEventsFromRelays(DEFAULT_RELAYS,{
        kinds: [3],
        authors: [authorPubkey]
    }, true)
    
    if (!existingContacts) {
        return
    }
    
    const targetPubkey = normalizePublicKey(npub);
    const newTags = existingContacts.tags.filter((item: string[]) => item[1] !== targetPubkey);
    
    return publishKind3(nsecOrNpub, newTags)
}

export const PublishNote = async (content: any, nsecOrNpub: string) => {
    // Validate content to ensure it's not empty
    if (!content || (typeof content === 'string' && content.trim() === '')) {
        throw new Error('Note content cannot be empty')
    }
    
    // Convert content to string if it's not already
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content)
    
    return publishKind1(nsecOrNpub, contentStr)
}

export const RepostNote = async (noteId: string, quoteContent: string, nsecOrNpub: string) => {
    const noteIdRaw = normalizeNoteId(noteId)
    // const note: any = await fetchAllFromAPI({
    //     ids: [noteIdRaw]
    // }, undefined, undefined, true)
    const note = await fetchEventsFromRelays(DEFAULT_RELAYS,{
        ids: [noteIdRaw]
    }, true)
    
    if (!note) {
        throw new Error(`Note with ID ${noteId} not found`);
    }

    if (quoteContent) {
        // Validate quoteContent to ensure it's not empty
        if (quoteContent.trim() === '') {
            throw new Error('Quote content cannot be empty')
        }
        
        const content = quoteContent
        const tags = [
            ['e', note.id, "", "mention"],
            ['p', note.pubkey, "", "mention"],
            ['q', note.id]
        ]
        return publishKind1(nsecOrNpub, `${content}\nnostr:${nip19.noteEncode(note.id)}`, tags)
    } else {
        const content = JSON.stringify(note)
        const tags = [
            ['e', note.id],
            ['p', note.pubkey],
        ]
        return publishKind6(nsecOrNpub, content, tags)
    }
}

export const ReactToNote = async (noteId: string, nsecOrNpub: string, content: string = "+") => {
    // Validate content
    if (!content || content.trim() === '') {
        content = "+"; // Default to "+" if empty
    }
    
    const noteIdRaw = normalizeNoteId(noteId)
    // const note: any = await fetchAllFromAPI({
    //     ids: [noteIdRaw]
    // }, undefined, undefined, true)
    const note = await fetchEventsFromRelays(DEFAULT_RELAYS, {
        ids: [noteIdRaw]
    }, true)
    
    if (!note) {
        throw new Error(`Note with ID ${noteId} not found`);
    }
    
    const tags = [
        ['e', note.id],
        ['p', note.pubkey],
    ]
    return publishKind7(nsecOrNpub, tags, content)
}

export const ReplyToNote = async (noteId: string, content: string, nsecOrNpub: string) => {
    // Validate content to ensure it's not empty
    if (!content || content.trim() === '') {
        throw new Error('Reply content cannot be empty')
    }
    
    const noteIdRaw = normalizeNoteId(noteId)
    // const note: any = await fetchAllFromAPI({
    //     ids: [noteIdRaw]
    // }, undefined, undefined, true)
    const note = await fetchEventsFromRelays(DEFAULT_RELAYS, {
        ids: [noteIdRaw]
    }, true)
    
    if (!note) {
        throw new Error(`Note with ID ${noteId} not found`);
    }
    
    const eTags: string[][] = note.tags.filter((t: string[]) => t[0] === "e");
    const tags = [
        ...eTags,
        ['e', note.id, "", eTags.length > 0 ? "reply" : "root"],
        ['p', note.pubkey],
    ]
    return publishKind1(nsecOrNpub, content, tags)
}

export const UpdateProfile = async (profileMetadata: any, nsec: string) => {
    // Validate profileMetadata to ensure it's not empty
    if (!profileMetadata || (typeof profileMetadata === 'object' && Object.keys(profileMetadata).length === 0)) {
        throw new Error('Profile metadata cannot be empty')
    }
    
    // If nsec is actually an npub (for remote signer), decode it differently
    let npub: string;
    if (nsec.startsWith('npub')) {
        npub = normalizePublicKey(nsec);
    } else {
        npub = getPublicKey(nip19.decode(nsec).data as Uint8Array);
    }
    
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
    const pubkey = normalizePublicKey(npub)
    
    switch (feedType) {
        case "FOLLOWING_FEED": {
            // const existingContacts = await fetchAllFromAPI({
            //     kinds: [3],
            //     authors: [pubkey]
            // }, undefined, undefined, true)
            const existingContacts = await fetchEventsFromRelays(DEFAULT_RELAYS,{
                kinds: [3],
                authors: [pubkey]
            }, true)
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
    const noteIdRaw = normalizeNoteId(noteId)
    // const replies = await fetchAllFromAPI({
    //     kinds: [1],
    //     "#e": [noteIdRaw]
    // }, false, [noteIdRaw], false, 60, true);
    const replies = await fetchEventsFromRelays(DEFAULT_RELAYS, {
        kinds: [1],
        "#e": [noteIdRaw]
    });

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
    const noteIdRaw = normalizeNoteId(noteId)
    const filter: Filter = {
        kinds: [9735],
        "#e": [noteIdRaw]
    }
    // return (await fetchAllFromAPI(filter)) as (NostrEvent & {kind:9735})[]
    return (await fetchEventsFromRelays(DEFAULT_RELAYS, filter)) as (NostrEvent & {kind:9735})[]
}

const getNprofile = async (npub: string) => {
    const pubkey = normalizePublicKey(npub)
    // const config = await fetchAllFromAPI({
    //     kinds: [3],
    //     authors: [pubkey]
    // }, undefined, undefined, true)
    const config = await fetchEventsFromRelays(DEFAULT_RELAYS, {
        kinds: [3],
        authors: [pubkey]
    }, true)
   
    let relays = DEFAULT_RELAYS
    if (config) {
        const configRelays = filterTagValues(config.tags, "r")
        relays = configRelays.length > 0 ? configRelays : DEFAULT_RELAYS
    }
    return nip19.nprofileEncode({ pubkey, relays })
}

export const GetNpubProfileMetadata = async (npub: string) => {
    const pubkey = normalizePublicKey(npub)
    // const metadataContent = await fetchAllFromAPI({
    //     kinds: [0],
    //     authors: [pubkey]
    // }, false, [pubkey], true, 60, true)
    const metadataContent = await fetchEventsFromRelays(DEFAULT_RELAYS, {
        kinds: [0],
        authors: [pubkey]
    }, true)
    return JSON.parse(metadataContent?.content || "{}")
}

export const GetNote = async (noteId: string) => {
    const noteIdRaw = normalizeNoteId(noteId)
    // return (await fetchAllFromAPI({
    //     ids: [noteIdRaw]
    // }, undefined, undefined, true, undefined, true)) as NostrEvent & {kind: 1}
    return (await fetchEventsFromRelays(DEFAULT_RELAYS, {
        ids: [noteIdRaw]
    }, true)) as NostrEvent & {kind: 1}
}

const getFollowing = async (npub: string): Promise<string[]> => {
    const pubkey = normalizePublicKey(npub)
    // const following = await fetchAllFromAPI({
    //     kinds: [3],
    //     authors: [pubkey]
    // }, undefined, undefined, true)
    const following = await fetchEventsFromRelays(DEFAULT_RELAYS, {
        kinds: [3],
        authors: [pubkey]
    }, true)
    return following ? filterTagValues(following.tags, "p") : []
}   

const getFollowers = async (npub: string): Promise<string[]> => {
    const pubkey = normalizePublicKey(npub)
    const filter: Filter = {
        kinds: [3],
        "#p": [pubkey]
    }
    // const followers = await fetchAllFromAPI(filter, false, [pubkey])
    const followers = await fetchEventsFromRelays(DEFAULT_RELAYS, filter)
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

export const GetNoteReactions = async (noteId: string, revalidate: boolean=false, since?: number) => {
    const noteIdRaw = normalizeNoteId(noteId)
    const filter: Filter = {
        kinds: [7],
        "#e": [noteIdRaw],
    }
    if (since) filter.since = since;
    // return fetchAllFromAPI(filter, revalidate, [noteIdRaw], false, 60, true)
    return fetchEventsFromRelays(DEFAULT_RELAYS, filter)
}

export const GetNoteReposts = async (noteId: string, revalidate: boolean=false, since?: number) => {
    const noteIdRaw = normalizeNoteId(noteId)
    const filter: Filter = {
        kinds: [6],
        "#e": [noteIdRaw],
    }
    if (since) filter.since = since;
    // return fetchAllFromAPI(filter, revalidate, [noteIdRaw], false, 60, true)
    return fetchEventsFromRelays(DEFAULT_RELAYS, filter)
}

export const GetFeed = async (npub: string, feedType: string, since?: number, until?: number, limit?: number) => {
    const authorRaw = normalizePublicKey(npub)
    const baseFilter: Filter = {
        kinds: [1],
        limit: limit || 20
    }
    if (since) baseFilter.since = since;
    if (until) baseFilter.until = until;

    switch (feedType) {
        case "FOLLOWING_FEED": {
            // const existingContacts = await fetchAllFromAPI({
            //     kinds: [3],
            //     authors: [authorRaw]
            // }, undefined, undefined, true)
            const existingContacts = await fetchEventsFromRelays(DEFAULT_RELAYS, {
                kinds: [3],
                authors: [authorRaw]
            }, true)
            if (!existingContacts) {                
                return []
            }
            const followingAuthors = filterTagValues(existingContacts.tags, "p")
            // return fetchAllFromAPI({
            //     ...baseFilter,
            //     authors: followingAuthors
            // }, true);
            return fetchEventsFromRelays(DEFAULT_RELAYS,{
                ...baseFilter,
                authors: followingAuthors
            });
        }
            
        case "NOTES_FEED":
            // return fetchAllFromAPI({
            //     ...baseFilter,
            //     authors: [authorRaw]
            // }, true);
            return fetchEventsFromRelays(DEFAULT_RELAYS, {
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
