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
        <div className="min-h-screen bg-[#f8faf9] safe-top safe-bottom">
            <div className="max-w-6xl mx-auto px-4 pt-6 pb-16 sm:px-6 sm:pt-12 lg:px-8">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-center text-[#368564] mb-6 sm:mb-12">
                    Apna Apps
                </h1>
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-8 sm:mb-12">
                    <SubmitApp />
                    <ImportNsecApp />
                </div>
                <AppList />
            </div>
        </div>
    );
}