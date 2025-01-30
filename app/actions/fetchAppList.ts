'use server'

import { unstable_cache } from 'next/cache';
import { GetNoteReactions, GetNoteReplies, GetNpubProfileMetadata } from '@/lib/nostr';
import { Event as NostrEvent } from 'nostr-tools';
import { AppDetails, APP_CATEGORIES, ProcessedAppEvent, AppCategory } from '@/lib/types/apps';
import { APPS_ROOT_NOTE_ID } from '@/lib/constants';

interface AppDetailsJSON {
    appURL: string;
    appName: string;
    categories: AppCategory[];
    mode: "Full-page";
    description: string;
}

async function parseAppDetailsFromJSON(text: string): Promise<AppDetailsJSON | null> {
    try {
        const json = JSON.parse(text);
        if (json && typeof json === 'object' && 'appURL' in json) {
            return {
                appURL: json.appURL,
                appName: json.appName,
                categories: Array.isArray(json.categories)
                    ? json.categories.filter((cat: string) => APP_CATEGORIES.includes(cat as AppCategory))
                    : ["Miscellaneous"],
                mode: "Full-page",
                description: json.description || `A ${json.categories?.[0] || "Miscellaneous"} app`
            };
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
            const replyEvents = await GetNoteReplies(APPS_ROOT_NOTE_ID, true) as NostrEvent[];
            const authorMetadataCache: Record<string, any> = {};

            // First, process all app submission events
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

            // Filter valid events
            const validEvents = processedEvents.filter((event): event is ProcessedAppEvent =>
                event !== null &&
                typeof event.appURL === 'string' &&
                typeof event.appName === 'string'
            );

            // For each valid event, check for update replies from the same author
            const updatedValidEvents = await Promise.all(
                validEvents.map(async (event) => {
                    // Get all replies to this app submission
                    const updateReplies = await GetNoteReplies(event.id, true); // Get only direct replies
                    
                    // Parse and validate all replies
                    const parsedReplies = await Promise.all(
                        updateReplies.map(async (reply: NostrEvent) => {
                            const updateDetails = await parseAppDetailsFromJSON(reply.content);
                            if (!updateDetails) return null;
                            
                            // Validate required fields
                            if (!updateDetails.appURL || !updateDetails.appName) return null;
                            
                            return {
                                reply,
                                details: updateDetails
                            };
                        })
                    );

                    // Filter valid replies by the same author and sort by timestamp
                    const validAuthorUpdates = parsedReplies
                        .filter((item): item is { reply: NostrEvent; details: AppDetailsJSON } =>
                            item !== null &&
                            item.reply.pubkey === event.pubkey // Same author only
                        )
                        .sort((a, b) => b.reply.created_at - a.reply.created_at); // Latest first

                    // Get the latest valid update or use the original event
                    const latestUpdate = validAuthorUpdates.length > 0
                        ? {
                            ...validAuthorUpdates[0].reply,
                            ...validAuthorUpdates[0].details
                        } as ProcessedAppEvent
                        : null;
                    return latestUpdate || event;
                })
            );

            // First, gather all pubkeys from the updated events
            const allPubkeys = new Set(updatedValidEvents.map(event => event.pubkey));

            // Fetch author metadata
            await Promise.all(
                Array.from(allPubkeys).map(async (pubkey) => {
                    authorMetadataCache[pubkey] = await GetNpubProfileMetadata(pubkey);
                })
            );

            // Process apps and their reactions
            for (const event of updatedValidEvents) {
                // Get reactions for the original app submission
                const originalEvent = validEvents.find(ve =>
                    ve.pubkey === event.pubkey &&
                    ve.appURL === event.appURL
                );
                const reactions = await GetNoteReactions(originalEvent?.id || event.id, revalidate);
                const avgRating = await calculateAverageRating(reactions);
                
                appList.push({
                    appURL: event.appURL,
                    appName: event.appName,
                    id: originalEvent?.id || event.id, // Keep original note ID for reactions
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
            revalidate: 3600 // Cache for an hour
        }
    )();
}