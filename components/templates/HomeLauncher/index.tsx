import AppList from "@/components/organisms/AppList";
import SubmitApp from "@/components/organisms/SubmitApp";
import ImportNsecApp from "@/components/organisms/ImportNsec";
import { useProfile } from "@/lib/hooks/useProfile";

export default function HomeLauncherComponent() {
    const { loading, error } = useProfile();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center">
                <p className="text-gray-600">Initializing profile...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center">
                <p className="text-red-600">Failed to initialize profile: {error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] bg-[#f8faf9] overflow-x-hidden">
            <div className="p-4 pb-20">
                <h1 className="text-2xl font-bold text-[#368564] mb-6 text-center">
                    Explore Apps
                </h1>
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-8">
                    <SubmitApp />
                    <ImportNsecApp />
                </div>
                <AppList />
            </div>
        </div>
    );
}