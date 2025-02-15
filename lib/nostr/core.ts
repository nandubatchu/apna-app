import { Event as NostrEvent, Filter } from 'nostr-tools'
import { SimplePool } from 'nostr-tools/pool'

export const DEFAULT_RELAYS = [
    "wss://eden.nostr.land/",
    "wss://nostr.wine/",
    "wss://relay.damus.io/",
    "wss://relay.nostr.band/",
    "wss://relay.snort.social"
]

export const pool = new SimplePool()

// Helper function to safely filter tag values to string[]
export const filterTagValues = (tags: any[], tagName: string): string[] => {
    if (!tags) return [];
    return tags
        .filter(tag => Array.isArray(tag) && tag[0] === tagName && typeof tag[1] === 'string')
        .map(tag => tag[1]);
};

export const fetchFromRelay = async (filter: Filter): Promise<NostrEvent|null> => {
    try {
        const event = await pool.get(DEFAULT_RELAYS, filter)
        if (event) {
            console.log('## got event:', event)
            return event
        }
        return null
    } catch (error) {
        console.error('Error fetching from relay:', error)
        return null
    }
}

export const fetchAllFromRelay = async (filter: Filter): Promise<NostrEvent[]> => {
    try {
        const events = await pool.querySync(DEFAULT_RELAYS, filter, {
            maxWait: 10000
        })
        console.log('## got events:', events)
        return events
    } catch (error) {
        console.error('Error fetching from relay:', error)
        return []
    }
}

import { PUBLIC_BASE_URL } from '@/lib/constants';

export const fetchAllFromAPI = async (filter: Filter, revalidate=false, tags: string[] = [], isSingleEvent: boolean = false) => {
    let url = `${PUBLIC_BASE_URL}/api/nostr/pool/get?`
    if (isSingleEvent) {
        url = `${url}isSingleEvent=1&`
    }
    if (revalidate) {
        url = `${url}noCache=1&`
    }
    if (tags.length > 0) {
        url = `${url}tags=${tags.join(",")}&`
    }
    url = `${url}query=${encodeURIComponent(JSON.stringify({
        relays: DEFAULT_RELAYS,
        filter
    }))}`
    return fetch(url).then(res=>res.json())
}

export const subscribeToEvents = async (filter: Filter, callback: (e: NostrEvent) => void) => {
    let lastEventTime = Math.floor(Date.now() / 1000);
    
    // Initial fetch
    const initialEvents = await pool.querySync(DEFAULT_RELAYS, filter, {
        maxWait: 5000
    });
    initialEvents.forEach(e => {
        console.log('## got event:', e)
        callback(e)
    });

    // Set up polling for new events
    const pollInterval = setInterval(async () => {
        const newFilter = {
            ...filter,
            since: lastEventTime
        };
        
        const newEvents = await pool.querySync(DEFAULT_RELAYS, newFilter, {
            maxWait: 5000
        });
        
        if (newEvents.length > 0) {
            lastEventTime = Math.max(...newEvents.map(e => e.created_at));
            newEvents.forEach(e => {
                console.log('## got event:', e)
                callback(e)
            });
        }
    }, 5000); // Poll every 5 seconds

    // Return cleanup function
    return () => clearInterval(pollInterval);
}