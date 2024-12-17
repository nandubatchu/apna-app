import { getPublicKey } from 'nostr-tools/pure'
import * as nip19 from 'nostr-tools/nip19'
import { Relay } from 'nostr-tools/relay'
import { setNostrWasm, generateSecretKey, finalizeEvent, verifyEvent } from 'nostr-tools/wasm'
import { initNostrWasm } from 'nostr-wasm'
import * as crypto from 'crypto'

const RELAY = "wss://relay.snort.social/"
// const RELAY = "wss://relay.damus.io/"

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

