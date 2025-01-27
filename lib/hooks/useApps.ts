import { useState, useEffect } from 'react';
import { fetchAppListAction } from '@/app/actions/fetchAppList';
import { AppDetails, AppCategory, APP_CATEGORIES } from '@/lib/types/apps';

export function useApps() {
    const [apps, setApps] = useState<AppDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAndSetAppList = async (revalidate = false) => {
        try {
            setLoading(true);
            const apps = await fetchAppListAction(revalidate);
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

export { APP_CATEGORIES };
export type { AppDetails, AppCategory };