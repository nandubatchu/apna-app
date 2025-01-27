'use server'

import { unstable_cache } from 'next/cache';
import { GetNoteReactions, GetNoteReplies, GetNpubProfileMetadata } from '@/lib/nostr';
import { Event as NostrEvent } from 'nostr-tools';
import { AppDetails, APP_CATEGORIES, ProcessedAppEvent } from '@/lib/types/apps';

async function parseAppDetailsFromJSON(text: string) {
    try {
        const json = JSON.parse(text);
        if (json && typeof json === 'object' && 'appURL' in json) {
            return {
                appURL: json.appURL,
                appName: json.appName,
                categories: Array.isArray(json.categories) 
                    ? json.categories.filter((cat: any) => APP_CATEGORIES.includes(cat))
                    : ["Miscellaneous"],
                mode: json.mode || "Full-page",
                description: json.description || `A ${json.categories?.[0] || "Miscellaneous"} app`
            } as const;
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
}

async function calculateAverageRating(reactions: NostrEvent[]): Promise<string> {
    let totalRating = 0;
    let count = 0;
    
    reactions.forEach((reaction) => {
        try {
            const data = JSON.parse(reaction.content);
            if (data && typeof data.rating === 'number') {
                totalRating += data.rating;
                count++;
            }
        } catch (e) {
            if (reaction.content === '+') {
                totalRating += 5;
                count++;
            } else if (reaction.content === '-') {
                totalRating += 1;
                count++;
            }
        }
    });
    
    return count > 0 ? (totalRating / count).toFixed(1) : '0.0';
}

export async function fetchAppListAction(revalidate = false): Promise<AppDetails[]> {
    return unstable_cache(
        async () => {
            const appList: AppDetails[] = [];
            const APP_REPLIES_NOTE = "note187j8dxwta5zvxle446uqutxue764q79vxmtv85dw7fnujlqgdm2qm7kelc"
            const replyEvents = await GetNoteReplies(APP_REPLIES_NOTE) as NostrEvent[];
            const authorMetadataCache: Record<string, any> = {};

            const processedEvents = await Promise.all(
                replyEvents
                    .sort((a, b) => b.created_at - a.created_at)
                    .map(async (replyEvent): Promise<ProcessedAppEvent | null> => {
                        const appDetails = await parseAppDetailsFromJSON(replyEvent.content);
                        return appDetails ? {
                            ...replyEvent,
                            ...appDetails
                        } : null;
                    })
            );

            const validEvents = processedEvents.filter((event): event is ProcessedAppEvent => 
                event !== null && 
                typeof event.appURL === 'string' && 
                typeof event.appName === 'string'
            );

            // First, gather all pubkeys
            const allPubkeys = new Set(validEvents.map(event => event.pubkey));

            // Fetch author metadata
            await Promise.all(
                Array.from(allPubkeys).map(async (pubkey) => {
                    authorMetadataCache[pubkey] = await GetNpubProfileMetadata(pubkey);
                })
            );

            // Process apps and their reactions
            for (const event of validEvents) {
                const reactions = await GetNoteReactions(event.id, revalidate);
                const avgRating = await calculateAverageRating(reactions);
                
                appList.push({
                    appURL: event.appURL,
                    appName: event.appName,
                    id: event.id,
                    pubkey: event.pubkey,
                    reactions,
                    avgRating,
                    categories: event.categories,
                    mode: event.mode,
                    description: event.description,
                    authorMetadata: authorMetadataCache[event.pubkey] || {}
                });
            }

            appList.sort((a, b) => parseFloat(b.avgRating) - parseFloat(a.avgRating));
            return appList;
        },
        ['app-list'],
        {
            tags: ['ApnaMiniAppDetails'],
            revalidate: 300 // Cache for 5 minutes
        }
    )();
}