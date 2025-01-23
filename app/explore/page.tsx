"use client"
import HomeLauncher from "@/components/templates/HomeLauncher";
import BottomNav from "@/components/organisms/BottomNav";

export default function ExplorePage() {
  return (
    <>
      <div className="min-h-[100dvh] bg-[#f8faf9] overflow-x-hidden">
        <HomeLauncher />
      </div>
      <BottomNav />
    </>
  );
}