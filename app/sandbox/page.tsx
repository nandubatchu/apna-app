import React from 'react';
import NotificationButton from '@/components/atoms/NotificationButton';
import PeriodicSyncButton from '@/components/atoms/PeriodicSyncButton';

const SandboxPage: React.FC = () => {
    return (
        <div className="container mx-auto p-8">
            <h1 className="text-2xl font-bold mb-6">Sandbox Page</h1>
            
            <div className="p-4 border rounded-lg bg-slate-50 mb-6">
                <h2 className="text-lg font-semibold mb-4">Service Worker Notification Test</h2>
                <p className="mb-4">Click the button below to trigger a local notification via the service worker.</p>
                <NotificationButton />
            </div>
            
            <div className="p-4 border rounded-lg bg-slate-50">
                <h2 className="text-lg font-semibold mb-4">Periodic Sync Test</h2>
                <p className="mb-4">Click the button below to register a periodic sync task with tag &quot;test&quot; and interval of 10000ms.</p>
                <p className="mb-4 text-sm text-amber-600">Note: Periodic Sync requires HTTPS and may only work in supported browsers like Chrome.</p>
                <PeriodicSyncButton />
            </div>
        </div>
    );
};

export default SandboxPage;