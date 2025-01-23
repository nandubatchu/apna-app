"use client"
import { useProfile } from "@/lib/hooks/useProfile";
import FavoritesList from "@/components/organisms/FavoritesList";
import BottomNav from "@/components/organisms/BottomNav";

export default function HomePage() {
  const { loading: profileLoading, error: profileError } = useProfile();

  if (profileLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#f8faf9] flex items-center justify-center">
        <p className="text-gray-600">Initializing profile...</p>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-[100dvh] bg-[#f8faf9] flex items-center justify-center">
        <p className="text-red-600">Failed to initialize profile: {profileError}</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-[100dvh] bg-[#f8faf9] overflow-x-hidden">
        <div className="p-4 pb-20">
          <h1 className="text-2xl font-bold text-[#368564] mb-6 text-center">
            Apna
          </h1>
          <FavoritesList />
        </div>
      </div>
      <BottomNav />
    </>
  );
}
