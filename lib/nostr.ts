import { getPublicKey, VerifiedEvent, Event as NostrEvent } from 'nostr-tools/pure'
import * as nip19 from 'nostr-tools/nip19'
import { Relay } from 'nostr-tools/relay'
import { setNostrWasm, generateSecretKey, finalizeEvent, verifyEvent } from 'nostr-tools/wasm'
import { initNostrWasm } from 'nostr-wasm'
import * as crypto from 'crypto'
import { revalidateTag } from 'next/cache'

// const RELAY = "wss://relay.snort.social/"
const RELAY = "wss://relay.damus.io/"

// make sure this promise resolves before your app starts calling finalizeEvent or verifyEvent
const initPromise = initNostrWasm().then(setNostrWasm)

declare global {
    interface Window {
        nip19: any;
    }
}
if (typeof window !== "undefined") {
    window.nip19 = nip19
}

export const GenerateKeyPair = () => {
    let sk = generateSecretKey() // `sk` is a Uint8Array
    let nsec = nip19.nsecEncode(sk)

    let pk = getPublicKey(sk) // `pk` is a hex string
    let npub = nip19.npubEncode(pk)

    // let relays = ['wss://relay.nostr.example.mydomain.example.com', 'wss://nostr.banana.com']
    // let nprofile = nip19.nprofileEncode({ pubkey: pk, relays })

    const keyPair = {
        nsec,
        npub,
        // nprofile,
    }
    console.log(keyPair)
    return keyPair
}

export const InitialiseProfile = async (nsec: string) => {
    let nprofile = nip19.nprofileEncode({ pubkey: getPublicKey(nip19.decode(nsec).data as Uint8Array), relays: [RELAY] })
    let metadata = {
        name: crypto.randomBytes(10).toString('hex').slice(0, 10),
        about: "Bitcoin Enthusiast"
    }
    await publishKind0(nsec, metadata)
    await publishKind3(nsec, [
        ['r', RELAY, 'read', 'write']
    ])
    let profile = {
        nprofile,
        metadata
    }
    return profile
}

const publishEvent = async (nsec: string, event: any) => {
    const decodedNsec = nip19.decode(nsec);
    if (decodedNsec.type != "nsec") {
        throw new Error("invalid nsec");

    }
    const sk = decodedNsec.data;
    await initPromise;
    let signedEvent = finalizeEvent(event, sk)
    let isGood = verifyEvent(signedEvent)
    console.log(`signedEvent - ${JSON.stringify(signedEvent)}`)
    if (!isGood) {
        throw new Error("event verification failed")
    }
    const relay = await Relay.connect(RELAY)
    console.log(`connected to ${relay.url}`)
    const publishedEvent = await relay.publish(signedEvent)
    console.log(`published event - ${publishedEvent}`)
    relay.close()
    return signedEvent
}

const publishKind0 = async (nsec: string, profile: any) => {
    const event = {
        kind: 0,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: JSON.stringify(profile),
    }
    return publishEvent(nsec, event)
}

const publishKind1 = async (nsec: string, content: string, tags: any[] = []) => {
    const event = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags,
        content,
    }
    return (await publishEvent(nsec, event)) as VerifiedEvent & { kind: 1 }
}

const publishKind3 = async (nsec: string, tags: any[]) => {
    const event = {
        kind: 3,
        created_at: Math.floor(Date.now() / 1000),
        tags,
        content: "",
    }
    await publishEvent(nsec, event)
}

const publishKind6 = async (nsec: string, content: string, tags: any[]) => {
    const event = {
        kind: 6,
        created_at: Math.floor(Date.now() / 1000),
        tags,
        content,
    }
    return (await publishEvent(nsec, event)) as VerifiedEvent & { kind: 6 }
}

const publishKind7 = async (nsec: string, tags: any[], content: string = "+") => {
    const event = {
        kind: 7,
        created_at: Math.floor(Date.now() / 1000),
        tags,
        content,
    }
    return (await publishEvent(nsec, event)) as VerifiedEvent & { kind: 7 }
}

export const FollowNpub = async (npub: string, nsec: string) => {
    const existingContacts = await fetchFromRelay([{
        kinds: [3],
        authors: [getPublicKey(nip19.decode(nsec).data as Uint8Array)]
    }])
    console.log(existingContacts)
    let newTags = []
    if (existingContacts) {
        // @ts-ignore   
        newTags.push(...existingContacts.tags, ["p", nip19.decode(npub).data as string])
        newTags = Array.from(
            new Set(newTags.map((item) => JSON.stringify(item)))
          ).map((json) => JSON.parse(json));
    } else {
        newTags.push(["p", nip19.decode(npub).data as string])
    }
    

    return publishKind3(nsec, newTags)
}

export const UnfollowNpub = async (npub: string, nsec: string) => {
    const existingContacts = await fetchFromRelay([{
        kinds: [3],
        authors: [getPublicKey(nip19.decode(nsec).data as Uint8Array)]
    }])
    console.log(existingContacts)
    if (!existingContacts) {
        return
    } 
    // @ts-ignore   
    const newTags = existingContacts.tags.filter(item => item[1] !== nip19.decode(npub).data as string);
    
    return publishKind3(nsec, newTags)
    
}

const subscribeToEvents = async (filters: any[], callback: (e: any) => void) => {
    const relay = await Relay.connect(RELAY)
    console.log(`connected to ${relay.url}`)
    relay.subscribe(filters, {
        onevent(e) {
            console.log('## got event:', e)
            callback(e)
        }
    })
}

export const PublishNote = async (content: any, nsec: string) => {
    return publishKind1(nsec, content)
}

export const RepostNote = async (noteId: string, quoteContent: string, nsec: string) => {
    const noteIdRaw = noteId.includes("note1") ? nip19.decode(noteId).data as string : noteId
    const note: any = await fetchFromRelay([{
        ids: [noteIdRaw]
    }])

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
    const note: any = await fetchFromRelay([{
        ids: [noteIdRaw]
    }])
    const tags = [
        ['e', note.id],
        ['p', note.pubkey],
    ]
    return publishKind7(nsec, tags, content)
}

export const ReplyToNote = async (noteId: string, content: string, nsec: string) => {
    const noteIdRaw = noteId.includes("note1") ? nip19.decode(noteId).data as string : noteId
    const note: any = await fetchFromRelay([{
        ids: [noteIdRaw]
    }])
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
    const nprofile = await getNprofile(npub)
    const metadata = JSON.parse((await publishKind0(nsec, profileMetadata) as any).content)
    const following = await getFollowing(npub)
    const followers = await getFollowers(npub)
    
    return {
        nprofile,
        metadata,
        followers,
        following
    }
}

export const SubscribeToFeed = async (npub: string, feedType: string, callback: (note: any) => void) => {
    switch (feedType) {
        case "FOLLOWING_FEED":
            const existingContacts = await fetchFromRelay([{
                kinds: [3],
                authors: [nip19.decode(npub).data as string]
            }])
            console.log(existingContacts)
            if (!existingContacts) {
                return
            } 
            await subscribeToEvents([{
                kinds: [1],
                // @ts-ignore
                authors: existingContacts.tags.map((tag) => tag[0] === "p" && tag[1]).filter(a => a)
            }], callback)
            break;

        case "NOTES_FEED":
            await subscribeToEvents([{
                kinds: [1],
                // @ts-ignore
                authors: [nip19.decode(npub).data as string]
            }], callback)
            break;
    
        default:
            break;
    }
}

export const SubscribeToNotifications = async (callback: (note: any) => void, npub: string) => {
    await subscribeToEvents([{
        kinds: [1],
        authors: []
    }], callback)
}

export const GetNoteReplies = async (noteId: string) => {
    const noteIdRaw = noteId.includes("note1") ? nip19.decode(noteId).data as string : noteId
    return fetchAllFromAPI({
        kinds: [1],
        "#e": [noteIdRaw]
    })
    return (await fetchAllFromRelay([{
        kinds: [1],
        "#e": [nip19.decode(noteId).data as string]
    }])) as (NostrEvent & {kind:1})[]
}

export const GetNoteZaps = async (noteId: string) => {
    const noteIdRaw = noteId.includes("note1") ? nip19.decode(noteId).data as string : noteId
    return (await fetchAllFromRelay([{
        kinds: [9735],
        "#e": [noteIdRaw]
    }])) as (NostrEvent & {kind:9735})[]
}

const getNprofile = async (npub: string) => {
    const config = await fetchFromRelay([{
        kinds: [3],
        authors: [nip19.decode(npub).data as string]
    }])
   
    let relays = [RELAY]
    if (config) {
         // @ts-ignore
        relays = config.tags.map((tag) => tag[0] === "r" && tag[1]).filter(a => a)
    }
    return nip19.nprofileEncode({ pubkey: nip19.decode(npub).data as string, relays })
}

export const GetNpubProfileMetadata = async (npub: string) => {
    const pubkey = npub.includes("npub") ? nip19.decode(npub).data as string : npub
    const metadataContent = await fetchAllFromAPI({
        kinds: [0],
        authors: [pubkey]
    })
    return JSON.parse(metadataContent[0].content || {})
    return JSON.parse((await fetchFromRelay([{
        kinds: [0],
        authors: [pubkey]
    }]) as any)?.content || {})
}

export const GetNote = async (noteId: string) => {
    const noteIdRaw = noteId.includes("note1") ? nip19.decode(noteId).data as string : noteId
    return (await fetchFromRelay([{
        ids: [noteIdRaw]
    }])) as NostrEvent & {kind: 1}
}

const getFollowing = async (npub: string): Promise<string[]> => {
    const following = await fetchFromRelay([{
        kinds: [3],
        authors: [nip19.decode(npub).data as string]
    }])
    // @ts-ignore
    return following.tags.map((tag) => tag[0] === "p" && tag[1]).filter(a => a)
}   

const getFollowers = async (npub: string) => {
    const followers = await fetchAllFromRelay([{
        kinds: [3],
        "#p": [nip19.decode(npub).data as string]
    }])
    // @ts-ignore
    return followers.map((e) => e.pubkey)
}

export const GetNpubProfile = async (npub: string) => {
    const nprofile = await getNprofile(npub)
    const metadata = await GetNpubProfileMetadata(npub)
    const following = await getFollowing(npub)
    const followers = await getFollowers(npub)
    
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
    }, revalidate)
    return fetchAllFromRelay([{
        kinds: [7],
        "#e": [noteIdRaw],
    }])
}

const fetchFromRelay = async (filters: any[]): Promise<NostrEvent|null> => {
    return new Promise(async (resolve, reject) => {
        const relay = await Relay.connect(RELAY)
        console.log(`connected to ${relay.url}`)
        relay.subscribe(filters, {
            onevent(e) {
                console.log('## got event:', e)
                resolve(e)
            }
        })
        setTimeout(() => resolve(null), 5000)
    })
}

const fetchAllFromRelay = async (filters: any[]) => {
    return new Promise(async (resolve, reject) => {
        const results: any[] = []
        const relay = await Relay.connect(RELAY)
        console.log(`connected to ${relay.url}`)
        relay.subscribe(filters, {
            onevent(e) {
                console.log('## got event:', e)
                results.push(e)
            },
            oneose() {
                resolve(results)
                relay.close()
            }
        })
        setTimeout(() => resolve(null), 10000)
    })
}

const fetchAllFromAPI = async (filter: any, revalidate=false) => {
    let url = `/api/nostr/pool/get?`
    if (revalidate) {
        url = `${url}noCache=1&`
        // revalidateTag('testtag')
        // console.log('revalidated tag testtag')
    }
    url = `${url}query=${encodeURIComponent(JSON.stringify({
        relays: [RELAY],
        filter
    }))}`
    return fetch(url).then(res=>res.json())
}

export const GetFeed = async (npub: string, feedType: string, since?: number, until?: number, limit?: number) => {
    const filter: any = {
        kinds: [1],
        limit: limit || 20
    }
    if (since) filter.since = since;
    if (until) filter.until = until;

    switch (feedType) {
        case "FOLLOWING_FEED":
            const existingContacts = await fetchFromRelay([{
                kinds: [3],
                authors: [nip19.decode(npub).data as string]
            }])
            if (!existingContacts) {
                return []
            }
            // @ts-ignore
            filter.authors = existingContacts.tags.map((tag) => tag[0] === "p" && tag[1]).filter(a => a)
            return fetchAllFromAPI(filter);
            
        case "NOTES_FEED":
            filter.authors = [nip19.decode(npub).data as string]
            return fetchAllFromAPI(filter);
            
        default:
            return [];
    }
}

export const Test = async () => {
    const relay = await Relay.connect(RELAY)
    console.log(`connected to ${relay.url}`)
    console.log(nip19.decode("npub1w46mjnagz9f0u556fzva8ypfftc5yfm32n8ygqmd2r32mxw4cfnsvkvy9e").data)
    relay.subscribe([
        {
            kinds: [0,3],
            authors: [nip19.decode("npub1w46mjnagz9f0u556fzva8ypfftc5yfm32n8ygqmd2r32mxw4cfnsvkvy9e").data as string],
        },
    ], {
        onevent(e) {
            console.log('## got event:', e)
        }
    })
    await new Promise((resolve) => setTimeout(resolve, 2000))
    return
}


export const CreateEvent = async (nsec: string) => {
    const decodedNsec = nip19.decode(nsec);
    if (decodedNsec.type != "nsec") {
        throw new Error("invalid nsec");

    }
    const sk = decodedNsec.data;
    await initPromise;
    let event = finalizeEvent({
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: 'hello world',
    }, sk)

    let isGood = verifyEvent(event)
    if (isGood) {
        const relay = await Relay.connect(RELAY)
        console.log(`connected to ${relay.url}`)

        relay.subscribe([
            {
                kinds: [1],
                authors: [getPublicKey(sk)],
            },
        ], {
            onevent(e) {
                console.log('got event:', e)
            }
        })

        const evt = await relay.publish(event)
        console.log(`published event - ${evt}`)
        relay.close()
        console.log(nip19.decode("note1lsu33avk5cu9rww002kuwkjd68ezpn33aq2yxuxc9euxn077x3ssz2d4fs"))
    }
}

