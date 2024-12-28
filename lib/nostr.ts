import { getPublicKey } from 'nostr-tools/pure'
import * as nip19 from 'nostr-tools/nip19'
import { Relay } from 'nostr-tools/relay'
import { setNostrWasm, generateSecretKey, finalizeEvent, verifyEvent } from 'nostr-tools/wasm'
import { initNostrWasm } from 'nostr-wasm'
import * as crypto from 'crypto'

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
    if (isGood) {
        const relay = await Relay.connect(RELAY)
        console.log(`connected to ${relay.url}`)
        const publishedEvent = await relay.publish(signedEvent)
        console.log(`published event - ${publishedEvent}`)
        relay.close()
    }
}

const publishKind0 = async (nsec: string, profile: any) => {
    const event = {
        kind: 0,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: JSON.stringify(profile),
    }
    await publishEvent(nsec, event)
}

const publishKind1 = async (nsec: string, content: string, tags: any[] = []) => {
    const event = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags,
        content,
    }
    await publishEvent(nsec, event)
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
    await publishEvent(nsec, event)
}

const publishKind7 = async (nsec: string, tags: any[]) => {
    const event = {
        kind: 7,
        created_at: Math.floor(Date.now() / 1000),
        tags,
        content: "+",
    }
    await publishEvent(nsec, event)
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
    const note: any = await fetchFromRelay([{
        ids: [nip19.decode(noteId).data as string]
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

export const LikeNote = async (noteId: string, nsec: string) => {
    const note: any = await fetchFromRelay([{
        ids: [nip19.decode(noteId).data as string]
    }])
    const tags = [
        ['e', note.id],
        ['p', note.pubkey],
    ]
    return publishKind7(nsec, tags)
}

export const ReplyToNote = async (noteId: string, content: string, nsec: string) => {
    const note: any = await fetchFromRelay([{
        ids: [nip19.decode(noteId).data as string]
    }])
    const eTags: string[][] = note.tags.filter((t: string[]) => t[0] === "e");
    const tags = [
        ...eTags,
        ['e', note.id, "", eTags.length > 0 ? "reply" : "root"],
        ['p', note.pubkey],
    ]
    return publishKind1(nsec, content, tags)
}

export const UpdateProfile = async (profile: any, nsec: string) => {
    return publishKind0(nsec, profile.metadata)
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
    return fetchAllFromRelay([{
        kinds: [1],
        "#e": [nip19.decode(noteId).data as string]
    }])
}

export const GetNpubProfile = async (npub: string) => {
    const metadata = await fetchFromRelay([{
        kinds: [0],
        authors: [nip19.decode(npub).data as string]
    }])
    const following = await fetchFromRelay([{
        kinds: [3],
        authors: [nip19.decode(npub).data as string]
    }])

    const followers = await fetchAllFromRelay([{
        kinds: [3],
        "#p": [nip19.decode(npub).data as string]
    }])
    
    return {
        metadata,
        // @ts-ignore
        followers: followers.map((e) => e.pubkey),
        // @ts-ignore
        following: following.tags.map((tag) => tag[0] === "p" && tag[1]).filter(a => a)
    }
}

const fetchFromRelay = async (filters: any[]) => {
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

