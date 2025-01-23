import AppList from "@/components/organisms/AppList";
import SubmitApp from "@/components/organisms/SubmitApp";
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
                <div className="flex justify-center mb-8">
                    <SubmitApp />
                </div>
                <AppList />
            </div>
        </div>
    );
}