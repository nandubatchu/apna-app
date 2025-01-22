'use client'
import { useRouter } from 'next/navigation'
import { GetNoteReactions, GetNoteReplies, GetNpubProfileMetadata } from '@/lib/nostr'
import { Avatar, AvatarFallback } from '@radix-ui/react-avatar'
import { useEffect, useState } from 'react'
import { RatingDisplay } from '@/components/molecules/RatingDisplay'

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

const fetchAppList = async (revalidate = false) => {
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
        // Calculate average rating
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
        const avgRating = count > 0 ? (totalRating / count).toFixed(1) : '0.0';
        
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

export default function AppLauncherList() {
    const router = useRouter()
    const [selectedApp, setSelectedApp] = useState<string | null>(null)
    const [apps, setApps] = useState<AppDetails[]>([]);

    const fetchAndSetAppList = async (revalidate = false) => {
        setApps(await fetchAppList(revalidate))
    }

    useEffect(() => {
        fetchAndSetAppList()
    }, [])

    const launchApp = (appURL: string, appId: string) => {
        setSelectedApp(appURL)
        router.push(`/mini-app?miniAppUrl=${appURL}&appId=${appId}`)
    }

    return (
        <div className="grid gap-6">
            {apps.map((app) => (
                <div key={app.appName} className="group">
                    <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                        <button
                            className={`w-full text-left ${
                                selectedApp === app.appName ? 'ring-2 ring-[#368564] ring-opacity-50' : ''
                            }`}
                            onClick={() => launchApp(app.appURL, app.id)}
                        >
                            <div className="p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-[#368564] transition-colors truncate">
                                            {app.appName}
                                        </h2>
                                        <p className="mt-2 text-sm text-gray-500 break-all line-clamp-2 sm:line-clamp-1">
                                            {app.appURL}
                                        </p>
                                        <div className="mt-3 flex items-center">
                                            <Avatar className="h-7 w-7 sm:h-6 sm:w-6 rounded-full bg-[#e6efe9]">
                                                <AvatarFallback className="text-[#368564]">
                                                    {app.authorMetadata.name?.[0]?.toUpperCase() || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <p className="ml-2 text-sm font-medium text-gray-600 truncate">
                                                {app.authorMetadata.name || 'Anonymous'}
                                            </p>
                                        </div>
                                    </div>
                                    <RatingDisplay app={app} />
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}
