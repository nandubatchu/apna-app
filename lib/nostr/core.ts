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

// --- Extensible n-tier concurrency queue ---
type TierConfig = {
    maxConcurrentFetches: number;
    queuePromotionTimeout: number; // ms
};

// Example default tiers: fast, medium, slow
export let tiers: TierConfig[] = [
    { maxConcurrentFetches: 10, queuePromotionTimeout: 2000 },
    { maxConcurrentFetches: 5, queuePromotionTimeout: 5000 },
    { maxConcurrentFetches: 2, queuePromotionTimeout: 10000 },
    { maxConcurrentFetches: 2, queuePromotionTimeout: 15000 },
];

const activeCounts: number[] = new Array(tiers.length).fill(0);

const fetchQueue: Array<{ resolve: () => void; enqueuedAt: number }> = [];

/**
 * Set the tier configurations.
 * @param newTiers Array of tier configs
 */
export function setFetchTiers(newTiers: TierConfig[]) {
    tiers = newTiers;
    activeCounts.length = newTiers.length;
    for (let i = 0; i < newTiers.length; i++) {
        activeCounts[i] = 0;
    }
}

/**
 * Enqueue a fetch operation respecting multi-tier concurrency limits.
 */
async function enqueueFetch<T>(fn: () => Promise<T>): Promise<T> {
    let tierIndex = 0;
    const tierTimeoutHandles: Array<NodeJS.Timeout | null> = new Array(tiers.length).fill(null);
    let released = false;

    const releaseSlot = () => {
        if (!released) {
            released = true;
            activeCounts[tierIndex]--;
            console.log(`[enqueueFetch] Slot released from tier ${tierIndex}. Active in tier: ${activeCounts[tierIndex]}`);
            if (fetchQueue.length > 0) {
                console.log(`[enqueueFetch] Triggering next queued request. Queue length before dequeue: ${fetchQueue.length}`);
                const nextItem = fetchQueue.shift();
                if (nextItem) {
                    const delay = Date.now() - nextItem.enqueuedAt;
                    console.log(`[enqueueFetch] Dequeued and starting request after waiting ${delay} ms. Queue length after dequeue: ${fetchQueue.length}`);
                    nextItem.resolve();
                }
            }
        }
    };

    const tryPromote = () => {
        if (released) return;
        const nextTier = tierIndex + 1;
        if (nextTier >= tiers.length) {
            console.log(`[enqueueFetch] Fetch running >${tiers[tierIndex].queuePromotionTimeout}ms, but no higher tier exists.`);
            return;
        }
        if (activeCounts[nextTier] < tiers[nextTier].maxConcurrentFetches) {
            activeCounts[tierIndex]--;
            activeCounts[nextTier]++;
            console.log(`[enqueueFetch] Promoting fetch from tier ${tierIndex} to tier ${nextTier}.`);
            tierIndex = nextTier;
        } else {
            console.log(`[enqueueFetch] Promotion to tier ${nextTier} blocked, max concurrency reached (${tiers[nextTier].maxConcurrentFetches}).`);
        }
    };

    // Wait for a free slot in tier 0
    while (activeCounts[0] >= tiers[0].maxConcurrentFetches) {
        console.log(`[enqueueFetch] Tier 0 full (${tiers[0].maxConcurrentFetches}). Queuing request. Queue length before enqueue: ${fetchQueue.length}`);
        const enqueuedAt = Date.now();
        await new Promise<void>(resolve => fetchQueue.push({ resolve, enqueuedAt }));
        const delay = Date.now() - enqueuedAt;
        console.log(`[enqueueFetch] Dequeued and starting request after waiting ${delay} ms. Queue length after dequeue: ${fetchQueue.length}`);
    }
    activeCounts[0]++;
    console.log(`[enqueueFetch] Starting request in tier 0. Active count: ${activeCounts[0]}`);

    // Set up promotion timers for each tier
    for (let i = 0; i < tiers.length - 1; i++) {
        tierTimeoutHandles[i] = setTimeout(() => {
            tryPromote();
        }, tiers[i].queuePromotionTimeout);
    }

    try {
        const result = await fn();
        for (const handle of tierTimeoutHandles) {
            if (handle) clearTimeout(handle);
        }
        releaseSlot();
        return result;
    } catch (error) {
        for (const handle of tierTimeoutHandles) {
            if (handle) clearTimeout(handle);
        }
        releaseSlot();
        throw error;
    }
}

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

/**
 * Fetch events from a list of relays with caching.
 * @param relays List of relay URLs
 * @param filter Nostr filter
 * @param singleEvent If true, fetch a single event (default: false)
 * @returns Promise resolving to a single event or array of events
 */
export function fetchEventsFromRelays(
    relays: string[],
    filter: Filter,
    singleEvent: true
): Promise<NostrEvent | null>;

export function fetchEventsFromRelays(
    relays: string[],
    filter: Filter,
    singleEvent?: false
): Promise<NostrEvent[]>;

export async function fetchEventsFromRelays(
    relays: string[],
    filter: Filter,
    singleEvent: boolean = false
): Promise<NostrEvent | NostrEvent[] | null> {
    const keyObj = {
        relays,
        filter,
        singleEvent
    };
    const cacheKey = hashCode(JSON.stringify(keyObj));

    if (promiseCache.has(cacheKey)) {
        console.log('## returning cached promise for fetchEventsFromRelays', keyObj);
        return promiseCache.get(cacheKey);
    }

    const promise = enqueueFetch(async () => {
        try {
            if (singleEvent) {
                const event = await pool.get(relays, filter);
                return event ?? null;
            } else {
                const events = await pool.querySync(relays, filter, { maxWait: 10000 });
                return events;
            }
        } catch (error) {
            console.error('Error in fetchEventsFromRelays:', error);
            return singleEvent ? null : [];
        }
    });

    promiseCache.set(cacheKey, promise);

    setTimeout(() => {
        promiseCache.delete(cacheKey);
        console.log('## removed cached promise for fetchEventsFromRelays', keyObj);
    }, 10000);

    return promise;
};

export { DEFAULT_RELAYS } from "@/lib/constants";