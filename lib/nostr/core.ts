import { Event as NostrEvent, Filter } from 'nostr-tools'
import { SimplePool } from 'nostr-tools/pool'
import { DEFAULT_RELAYS } from "@/lib/constants";

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

const promiseCache = new Map();

// Simple hash function
const hashCode = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
};

export const fetchAllFromAPI = async (
    filter: Filter,
    revalidate=false,
    tags: string[] = [],
    isSingleEvent: boolean = false,
    revalidateInSeconds?: number,
    publicCache: boolean = false
) => {
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
    if (revalidateInSeconds !== undefined) {
        url = `${url}revalidateInSeconds=${revalidateInSeconds}&`
    }
    if (publicCache) {
        url = `${url}publicCache=1&`
    }
    url = `${url}query=${encodeURIComponent(JSON.stringify({
        relays: DEFAULT_RELAYS,
        filter
    }))}`

    const cacheKey = hashCode(url);

    if (promiseCache.has(cacheKey)) {
        console.log('## returning cached promise for', url)
        return promiseCache.get(cacheKey);
    }

    const promise = fetch(url).then(res => res.json());

    promiseCache.set(cacheKey, promise);
    console.log('## caching promise for', url)
    setTimeout(() => {
        promiseCache.delete(cacheKey);
        console.log('## removing cached promise for', url)
    }, 10000);

    return promise;
}

export const subscribeToEvents = async (filter: Filter, callback: (e: NostrEvent) => void) => {
    let lastEventTime = Math.floor(Date.now() / 1000);
    
    // Create two filters: one for historical events and one for new events
    const historicalFilter = { ...filter };
    const newEventsFilter = { ...filter, since: lastEventTime };
    
    // Set up subscription using subscribeMany for both historical and new events
    const sub = pool.subscribeMany(
        DEFAULT_RELAYS,
        [historicalFilter],
        {
            onevent: (event) => {
                console.log('## got event:', event);
                
                // Update lastEventTime if this is a newer event
                if (event.created_at > lastEventTime) {
                    lastEventTime = event.created_at;
                }
                
                callback(event);
            },
            maxWait: 5000
        }
    );
    
    // Return cleanup function that closes the subscription
    return () => sub.close();
}

export { DEFAULT_RELAYS } from "@/lib/constants";