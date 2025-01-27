import { getPublicKey, VerifiedEvent, Event as NostrEvent, Filter } from 'nostr-tools'
import * as nip19 from 'nostr-tools/nip19'
import { setNostrWasm, generateSecretKey, finalizeEvent, verifyEvent } from 'nostr-tools/wasm'
import { initNostrWasm } from 'nostr-wasm'
import * as crypto from 'crypto'
import { pool, DEFAULT_RELAYS } from './core'

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

    const keyPair = {
        nsec,
        npub,
    }
    console.log(keyPair)
    return keyPair
}

export const publishEvent = async (nsec: string, event: any) => {
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
    const pub = await pool.publish(DEFAULT_RELAYS, signedEvent)
    console.log(`published event - ${pub}`)
    return signedEvent
}

export const publishKind0 = async (nsec: string, profile: any) => {
    const event = {
        kind: 0,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: JSON.stringify(profile),
    }
    return publishEvent(nsec, event)
}

export const publishKind1 = async (nsec: string, content: string, tags: any[] = []) => {
    const event = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags,
        content,
    }
    return (await publishEvent(nsec, event)) as VerifiedEvent & { kind: 1 }
}

export const publishKind3 = async (nsec: string, tags: any[]) => {
    const event = {
        kind: 3,
        created_at: Math.floor(Date.now() / 1000),
        tags,
        content: "",
    }
    await publishEvent(nsec, event)
}

export const publishKind6 = async (nsec: string, content: string, tags: any[]) => {
    const event = {
        kind: 6,
        created_at: Math.floor(Date.now() / 1000),
        tags,
        content,
    }
    return (await publishEvent(nsec, event)) as VerifiedEvent & { kind: 6 }
}

export const publishKind7 = async (nsec: string, tags: any[], content: string = "+") => {
    const event = {
        kind: 7,
        created_at: Math.floor(Date.now() / 1000),
        tags,
        content,
    }
    return (await publishEvent(nsec, event)) as VerifiedEvent & { kind: 7 }
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
        const pub = await pool.publish(DEFAULT_RELAYS, event)
        console.log(`published event - ${pub}`)
        
        const filter: Filter = {
            kinds: [1],
            authors: [getPublicKey(sk)]
        }
        
        const events = await pool.querySync(DEFAULT_RELAYS, filter, {
            maxWait: 5000
        })
        
        events.forEach(e => {
            console.log('got event:', e)
        })
        
        console.log(nip19.decode("note1lsu33avk5cu9rww002kuwkjd68ezpn33aq2yxuxc9euxn077x3ssz2d4fs"))
    }
}