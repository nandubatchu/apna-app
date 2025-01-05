'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { GetNoteLikes, GetNoteReplies } from '@/lib/nostr'


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
    await Promise.all(replyEvents.sort((a: any, b: any) => b.created_at - a.created_at).map((replyEvent) => { return {...parseAppDetailsFromJSON(replyEvent.content), ...replyEvent} }).filter(each=>each.appURL && each.appName).map(async (appDetail) => {
        // const likes = await (await import("@/lib/nostrEventsCacheDB")).staleWhileRevalidate('likes', appDetail.id, () => GetNoteLikes(appDetail.id)) as any[]
        const likes = await GetNoteLikes(appDetail.id)
        const likeCount = likes.length
        console.log(appDetail.appName, likeCount)
        appList.push({ ...appDetail, likeCount })
    }))
    appList.sort((a,b) => b.likeCount - a.likeCount)
    console.log("applist", appList)
    return appList
}


export default function AppLauncherList() {
    const router = useRouter()
    const [selectedApp, setSelectedApp] = useState<string | null>(null)

    const [apps, setApps] = useState<any[]>([]);
    useEffect(() => {
        const init = async () => {
            setApps(await fetchAppList())
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
                                <p className="text-sm text-gray-500">({app.likeCount} Likes)</p>
                            </div>
                            <ChevronRight className="text-gray-400" />
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}

