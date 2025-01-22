import { GetNoteReactions, GetNoteReplies, GetNpubProfileMetadata } from '@/lib/nostr';
import { useState, useEffect } from 'react';

interface AppDetails {
    appURL: string;
    appName: string;
    id: string;
    pubkey: string;
    reactions: any[];
    avgRating: string;
    authorMetadata: {
        name?: string;
    };
}

function parseAppDetailsFromJSON(text: string) {
    try {
        const json = JSON.parse(text);
        if (json && typeof json === 'object' && 'appURL' in json) {
            return { appURL: json.appURL, appName: json.appName };
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
}

async function fetchAppList(revalidate = false) {
    const appList: AppDetails[] = [];
    const APP_REPLIES_NOTE = "note187j8dxwta5zvxle446uqutxue764q79vxmtv85dw7fnujlqgdm2qm7kelc"
    const replyEvents = await GetNoteReplies(APP_REPLIES_NOTE) as any[];
    const authorMetadataCache: Record<string, any> = {};

    const processedEvents = replyEvents
        .sort((a: any, b: any) => b.created_at - a.created_at)
        .map((replyEvent) => {
            const appDetails = parseAppDetailsFromJSON(replyEvent.content);
            return appDetails ? { ...appDetails, ...replyEvent } : null;
        })
        .filter((each): each is AppDetails & { pubkey: string; id: string } => 
            each !== null && each.appURL && each.appName
        );

    // First, gather all pubkeys
    const allPubkeys = new Set<string>();
    processedEvents.forEach(event => {
        allPubkeys.add(event.pubkey);
    });

    // Fetch author metadata
    await Promise.all(
        Array.from(allPubkeys).map(async (pubkey) => {
            authorMetadataCache[pubkey] = await GetNpubProfileMetadata(pubkey);
        })
    );

    // Process apps and their reactions
    for (const appDetail of processedEvents) {
        const reactions = await GetNoteReactions(appDetail.id, revalidate);
        const avgRating = calculateAverageRating(reactions);
        
        appList.push({
            ...appDetail,
            reactions,
            avgRating,
            authorMetadata: authorMetadataCache[appDetail.pubkey] || {}
        });
    }

    appList.sort((a, b) => parseFloat(b.avgRating) - parseFloat(a.avgRating));
    return appList;
}

function calculateAverageRating(reactions: any[]): string {
    let totalRating = 0;
    let count = 0;
    
    reactions.forEach((reaction: { content: string }) => {
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

export function useApps() {
    const [apps, setApps] = useState<AppDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAndSetAppList = async (revalidate = false) => {
        try {
            setLoading(true);
            const apps = await fetchAppList(revalidate);
            setApps(apps);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch apps');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAndSetAppList();
    }, []);

    return {
        apps,
        loading,
        error,
        refetch: fetchAndSetAppList
    };
}

export type { AppDetails };