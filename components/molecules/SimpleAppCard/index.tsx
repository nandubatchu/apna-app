"use client"
import type { AppDetails } from '@/lib/hooks/useApps';

interface SimpleAppCardProps {
  app: AppDetails;
  onSelect: (appURL: string, appId: string) => void;
}

export function SimpleAppCard({ app, onSelect }: SimpleAppCardProps) {
  return (
    <button
      onClick={() => onSelect(app.appURL, app.id)}
      className="w-full bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center p-4 gap-4">
        {/* Avatar - using first letter of app name as placeholder */}
        <div className="w-12 h-12 shrink-0 rounded-full bg-[#368564] text-white flex items-center justify-center text-xl font-semibold">
          {app.appName.charAt(0).toUpperCase()}
        </div>
        <h2 className="flex-1 text-lg font-medium text-left text-gray-900 group-hover:text-[#368564] transition-colors truncate">
          {app.appName}
        </h2>
      </div>
    </button>
  );
}