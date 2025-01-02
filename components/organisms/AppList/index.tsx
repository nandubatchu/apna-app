'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { GetNoteReplies } from '@/lib/nostr'


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

export default function AppLauncherList() {
    const router = useRouter()
    const [selectedApp, setSelectedApp] = useState<string | null>(null)

    const [apps, setApps] = useState<any[]>([]);
    useEffect(() => {
        const init = async () => {
            const results = (await GetNoteReplies("note187j8dxwta5zvxle446uqutxue764q79vxmtv85dw7fnujlqgdm2qm7kelc") as any[])
            const parsedResults = results.map((result) => { return { ...parseAppDetailsFromJSON(result.content), created_at: result.created_at } }).filter((n: any) => n)
            const ids = new Set(); // temp variable to keep track of accepted ids
            const uniqueResults = parsedResults.sort((a: any, b: any) => b.created_at - a.created_at).filter(({ appURL }: any) => appURL && !ids.has(appURL) && ids.add(appURL)) as any[];
            console.log(uniqueResults)
            setApps(uniqueResults)
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
                            <ChevronRight className="text-gray-400" />
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}

