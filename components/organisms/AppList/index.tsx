'use client'
import React from 'react'
import { useState } from 'react'
import { AppCard } from '@/components/molecules/AppCard'
import { useApps } from '@/lib/hooks/useApps'
import MiniAppModal from '../MiniAppModal'
import { Button } from '@/components/ui/button'
import type { AppDetails } from '@/lib/hooks/useApps'

export default function AppLauncherList() {
    const [selectedApp, setSelectedApp] = useState<AppDetails | null>(null)
    const { apps, loading, error, refetch } = useApps();

    const handleAppSelect = (appURL: string, appId: string) => {
        const app = apps.find(a => a.id === appId);
        if (app) {
            setSelectedApp(app)
        }
    }

    const handleClose = () => {
        setSelectedApp(null)
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
                <Button 
                    onClick={() => refetch(true)}
                    className="mt-4 px-4 py-2 bg-[#368564] text-white rounded-md hover:bg-[#2a6b4f]"
                >
                    Retry
                </Button>
            </div>
        )
    }

    return (
        <>
            <div className="grid gap-6">
                {apps.map((app) => (
                    <AppCard
                        key={app.id}
                        app={app}
                        selected={selectedApp?.id === app.id}
                        onSelect={handleAppSelect}
                    />
                ))}
                
                {apps.length === 0 && (
                    <div className="text-center py-8 text-gray-600">
                        No apps found
                    </div>
                )}
            </div>

            <MiniAppModal 
                isOpen={!!selectedApp}
                appUrl={selectedApp?.appURL || null}
                appId={selectedApp?.id || ""}
                appName={selectedApp?.appName || ""}
                onClose={handleClose}
            />
        </>
    )
}
