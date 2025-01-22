'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { GetNoteReactions, GetNoteReplies, GetNpubProfileMetadata, ReactToNote } from '@/lib/nostr'
import { Button } from '@/components/ui/button'
import { getKeyPairFromLocalStorage } from '@/lib/utils'
import { nip19 } from 'nostr-tools'
import { Avatar, AvatarImage, AvatarFallback } from '@radix-ui/react-avatar'

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

const fetchAppList = async (revalidate=false) => {
    const appList: any[] = []
    const APP_REPLIES_NOTE = "note187j8dxwta5zvxle446uqutxue764q79vxmtv85dw7fnujlqgdm2qm7kelc"
    const replyEvents = await GetNoteReplies(APP_REPLIES_NOTE) as any[]
    const noteIds = new Set();
    await Promise.all(replyEvents.sort((a: any, b: any) => b.created_at - a.created_at).map((replyEvent) => { return { ...parseAppDetailsFromJSON(replyEvent.content), ...replyEvent } }).filter(each => each.appURL && each.appName).map(async (appDetail) => {
        const authorProfileMetadata = await GetNpubProfileMetadata(appDetail.pubkey)
        const reactions = await GetNoteReactions(appDetail.id, revalidate)
        const upVotes = reactions.filter((reaction: any) => reaction.content === "+")
        const downVotes = reactions.filter((reaction: any) => reaction.content === "-")
        console.log(appDetail, authorProfileMetadata)
        appList.push({ ...appDetail, upVotes, downVotes, authorMetadata: authorProfileMetadata||{} })
    }))
    appList.sort((a, b) => {
        if (b.upVotes.length !== a.upVotes.length) {
            return b.upVotes.length - a.upVotes.length;
        }
        return a.downVotes.length - b.downVotes.length;
    })
    console.log("applist", appList)
    return appList
}

export default function AppLauncherList() {
    const router = useRouter()
    const [selectedApp, setSelectedApp] = useState<string | null>(null)
    const [apps, setApps] = useState<any[]>([]);

    const fetchAndSetAppList = async (revalidate=false) => {
        setApps(await fetchAppList(revalidate))
    }
    
    useEffect(() => {
        const init = async () => {
            await fetchAndSetAppList()
        }
        init()
    }, [])

    const launchApp = (appURL: string) => {
        setSelectedApp(appURL)
        router.push(`/mini-app?miniAppUrl=${appURL}`)
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
                            onClick={() => launchApp(app.appURL)}
                        >
                            <div className="p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-[#368564] transition-colors truncate">
                                            {app.appName}
                                        </h2>
                                        <p className="mt-2 text-sm text-gray-500 break-all line-clamp-2 sm:line-clamp-1">{app.appURL}</p>
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
                                    <div className="flex items-center sm:items-start space-x-6 sm:space-x-4">
                                        <div className="flex flex-col items-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="p-2 sm:p-1 hover:bg-[#e6efe9] transition-colors touch-action-manipulation"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const existingKeyPair = getKeyPairFromLocalStorage();
                                                    if (!app.upVotes.map((e: any) => e.pubkey).includes(nip19.decode(getKeyPairFromLocalStorage()!.npub).data)) {
                                                        ReactToNote(app.id, existingKeyPair!.nsec, "+").then(() => fetchAndSetAppList(true))
                                                    }
                                                }}
                                            >
                                                <ThumbsUp
                                                    fill={app.upVotes.map((e: any) => e.pubkey).includes(nip19.decode(getKeyPairFromLocalStorage()!.npub).data) ? "#368564" : "none"}
                                                    strokeWidth={app.upVotes.map((e: any) => e.pubkey).includes(nip19.decode(getKeyPairFromLocalStorage()!.npub).data) ? 0 : 2}
                                                    className="w-6 h-6 sm:w-5 sm:h-5 text-[#368564]"
                                                />
                                            </Button>
                                            <span className="text-base sm:text-sm font-medium text-gray-600">{app.upVotes.length || 0}</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="p-2 sm:p-1 hover:bg-[#e6efe9] transition-colors touch-action-manipulation"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const existingKeyPair = getKeyPairFromLocalStorage();
                                                    if (!app.downVotes.map((e: any) => e.pubkey).includes(nip19.decode(getKeyPairFromLocalStorage()!.npub).data)) {
                                                        ReactToNote(app.id, existingKeyPair!.nsec, "-").then(() => fetchAndSetAppList(true))
                                                    }
                                                }}
                                            >
                                                <ThumbsDown
                                                    fill={app.downVotes.map((e: any) => e.pubkey).includes(nip19.decode(getKeyPairFromLocalStorage()!.npub).data) ? "#368564" : "none"}
                                                    strokeWidth={app.downVotes.map((e: any) => e.pubkey).includes(nip19.decode(getKeyPairFromLocalStorage()!.npub).data) ? 0 : 2}
                                                    className="w-6 h-6 sm:w-5 sm:h-5 text-[#368564]"
                                                />
                                            </Button>
                                            <span className="text-base sm:text-sm font-medium text-gray-600">{app.downVotes.length || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}
