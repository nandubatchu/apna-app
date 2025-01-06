'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { GetNoteReactions, GetNoteReplies, ReactToNote } from '@/lib/nostr'
import { Button } from '@/components/ui/button'
import { getKeyPairFromLocalStorage } from '@/lib/utils'
import { nip19 } from 'nostr-tools'


function parseAppDetailsFromJSON(text: string) {
    try {
        // Attempt to parse the JSON string
        const json = JSON.parse(text);

        // Check if `appUrl` exists in the parsed object and return it
        if (json && typeof json === 'object' && 'appURL' in json) {
            return { appURL: json.appURL, appName: json.appName };
        } else {
            return null; // appUrl key does not exist
        }
    } catch (error) {
        return null; // Not a valid JSON string
    }
}

const fetchAppList = async () => {
    const appList: any[] = []
    const APP_REPLIES_NOTE = "note187j8dxwta5zvxle446uqutxue764q79vxmtv85dw7fnujlqgdm2qm7kelc"
    // const replyEvents = await (await import("@/lib/nostrEventsCacheDB")).staleWhileRevalidate('replies', APP_REPLIES_NOTE, () => GetNoteReplies(APP_REPLIES_NOTE)) as any[]
    const replyEvents = await GetNoteReplies(APP_REPLIES_NOTE) as any[]
    const noteIds = new Set();
    await Promise.all(replyEvents.sort((a: any, b: any) => b.created_at - a.created_at).map((replyEvent) => { return { ...parseAppDetailsFromJSON(replyEvent.content), ...replyEvent } }).filter(each => each.appURL && each.appName).map(async (appDetail) => {
        // const likes = await (await import("@/lib/nostrEventsCacheDB")).staleWhileRevalidate('likes', appDetail.id, () => GetNoteLikes(appDetail.id)) as any[]
        const reactions = await GetNoteReactions(appDetail.id)
        const upVotes = reactions.filter((reaction: any) => reaction.content === "+")
        const downVotes = reactions.filter((reaction: any) => reaction.content === "-")
        console.log(appDetail.appName)
        appList.push({ ...appDetail, upVotes, downVotes })
    }))
    appList.sort((a, b) => {
        // Sort by upVotes descending
        if (b.upVotes.length !== a.upVotes.length) {
            return b.upVotes.length - a.upVotes.length;
        }
        // If upVotes are the same, sort by downVotes ascending
        return a.downVotes.length - b.downVotes.length;
    })
    console.log("applist", appList)
    return appList
}


export default function AppLauncherList() {
    const router = useRouter()
    const [selectedApp, setSelectedApp] = useState<string | null>(null)

    const [apps, setApps] = useState<any[]>([]);

    const fetchAndSetAppList = async () => {
        setApps(await fetchAppList())
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
        // alert(`Launching ${appName}`)

    }

    return (

        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <ul className="divide-y divide-gray-200">
                {apps.map((app) => (
                    <li key={app.appName}>
                        <button
                            className={`w-full text-left px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-150 ${selectedApp === app.appName ? 'bg-blue-50' : ''
                                }`}
                            onClick={() => launchApp(app.appURL)}
                        >
                            <div>
                                <h2 className="text-lg font-medium text-gray-900">{app.appName}</h2>
                                <p className="text-sm text-gray-500">{app.appURL}</p>
                            </div>
                            <div className="flex items-center space-x-4 ml-4">
                            <div className="flex flex-col items-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-1"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log(app.id, 'up');
                                        const existingKeyPair = getKeyPairFromLocalStorage();
                                        if (!app.upVotes.map((e:any)=>e.pubkey).includes(nip19.decode(getKeyPairFromLocalStorage()!.npub).data)) {
                                            ReactToNote(app.id, existingKeyPair!.nsec, "+").then(() => fetchAndSetAppList())
                                        }
                                    }}
                                >
                                    <ThumbsUp 
                                        fill={ app.upVotes.map((e:any)=>e.pubkey).includes(nip19.decode(getKeyPairFromLocalStorage()!.npub).data) ? "#368564" : "none" } 
                                        strokeWidth={app.upVotes.map((e:any)=>e.pubkey).includes(nip19.decode(getKeyPairFromLocalStorage()!.npub).data) ? 0 : 2}
                                        className="w-4 h-4 text-gray-400" />
                                </Button>
                                <span className="text-xs text-gray-500">{app.upVotes.length || 0}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-1"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log(app.id, 'down');
                                        const existingKeyPair = getKeyPairFromLocalStorage();
                                        if (!app.downVotes.map((e:any)=>e.pubkey).includes(nip19.decode(getKeyPairFromLocalStorage()!.npub).data)) {
                                            ReactToNote(app.id, existingKeyPair!.nsec, "-").then(() => fetchAndSetAppList())
                                        }
                                    }}
                                >
                                    <ThumbsDown 
                                        fill={ app.downVotes.map((e:any)=>e.pubkey).includes(nip19.decode(getKeyPairFromLocalStorage()!.npub).data) ? "#368564" : "none" } 
                                        strokeWidth={app.downVotes.map((e:any)=>e.pubkey).includes(nip19.decode(getKeyPairFromLocalStorage()!.npub).data) ? 0 : 2}
                                        className="w-4 h-4 text-gray-400" />
                                </Button>
                                <span className="text-xs text-gray-500">{app.downVotes.length || 0}</span>
                            </div>
                        </div>
                        </button>
                        
                    </li>
                ))}
            </ul>
        </div>
    )
}
