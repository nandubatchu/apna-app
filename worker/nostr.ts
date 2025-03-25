// @ts-nocheck
importScripts("https://unpkg.com/nostr-tools@2.11.0/lib/nostr.bundle.js")

const DEFAULT_RELAYS = [
    "wss://eden.nostr.land/",
    "wss://nostr.wine/",
    "wss://relay.damus.io/",
    "wss://relay.nostr.band/",
    "wss://relay.snort.social"
]

const filterTagValues = (tags: any[], tagName: string): string[] => {
    if (!tags) return [];
    return tags
        .filter(tag => Array.isArray(tag) && tag[0] === tagName && typeof tag[1] === 'string')
        .map(tag => tag[1]);
};

const fetchFromRelays = async (relays: string[], filter: any) => {
    console.log(`Fetching from relays: ${relays} -`, filter)
    const pool = new self.NostrTools.SimplePool()
    try {
        const events = await pool.querySync(relays, filter, {
            maxWait: 30000
        })
        console.log('## got events:', events)
        return events
    } catch (error) {
        console.error('Error fetching from relay:', error)
        return []
    }
}

const fetchFollowingPubkeys = async (relays: string[], pubkey: string) => {
    const existingContacts = (await fetchFromRelays(relays, {
        kinds: [3],
        authors: [pubkey]
    }))[0]
    if (!existingContacts) {
        return []
    }
    const followingAuthors = filterTagValues(existingContacts.tags, "p")
    return followingAuthors || []
}

const fetchFeed = async (relays: string[], pubkey: string, since?: Number) => {
    const followingAuthors = await fetchFollowingPubkeys(relays, pubkey)
    const feed = await fetchFromRelays(relays, {
        kinds: [1],
        authors: followingAuthors,
        since,
        limit: 50
    })
    await feed.map(async e => {
        self.registration.showNotification(e.pubkey, {
            body: e.content,
        })
    })
}

export const handleFetchFeedPushEvent = async (data: any) => {
    await fetchFeed(data.relays, data.pubkey, data.since)
}