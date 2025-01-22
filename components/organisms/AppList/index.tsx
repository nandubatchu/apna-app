'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AppCard } from '@/components/molecules/AppCard'
import { useApps } from '@/lib/hooks/useApps'

export default function AppLauncherList() {
    const router = useRouter()
    const [selectedApp, setSelectedApp] = useState<string | null>(null)
    const { apps, loading, error, refetch } = useApps();

    const handleAppSelect = (appURL: string, appId: string) => {
        setSelectedApp(appURL)
        router.push(`/mini-app?miniAppUrl=${appURL}&appId=${appId}`)
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <p className="text-gray-600">Loading apps...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center py-8">
                <p className="text-red-600">Failed to load apps</p>
                <button 
                    onClick={() => refetch(true)}
                    className="mt-4 px-4 py-2 bg-[#368564] text-white rounded-md hover:bg-[#2a6b4f]"
                >
                    Retry
                </button>
            </div>
        )
    }

    return (
        <div className="grid gap-6">
            {apps.map((app) => (
                <AppCard
                    key={app.id}
                    app={app}
                    selected={selectedApp === app.appURL}
                    onSelect={handleAppSelect}
                />
            ))}
            
            {apps.length === 0 && (
                <div className="text-center py-8 text-gray-600">
                    No apps found
                </div>
            )}
        </div>
    )
}
