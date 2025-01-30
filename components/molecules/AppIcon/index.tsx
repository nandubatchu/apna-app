"use client"
import { getFaviconUrl } from '@/lib/utils';

interface AppIconProps {
  appName: string;
  appURL: string;
  appId: string;
  onSelect?: (appURL: string, appId: string) => void;
}

export function AppIcon({ appName, appURL, appId, onSelect }: AppIconProps) {
  const faviconUrl = getFaviconUrl(appURL);
  const trimmedName = appName.length > 12 ? `${appName.slice(0, 12)}...` : appName;

  return (
    <button
      onClick={() => onSelect?.(appURL, appId)}
      className="flex flex-col items-center gap-2 w-20"
    >
      <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center bg-white shadow-sm">
        {faviconUrl ? (
          <img 
            src={faviconUrl} 
            alt={`${appName} icon`}
            className="w-full h-full object-contain"
            onError={(e) => {
              const target = e.currentTarget;
              const parent = target.parentElement;
              if (parent) {
                parent.className = "w-16 h-16 rounded-2xl overflow-hidden bg-[#e6efe9] flex items-center justify-center";
                parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-[#368564] text-2xl font-semibold">${appName.charAt(0).toUpperCase()}</div>`;
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#368564] text-2xl font-semibold">
            {appName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <span className="text-sm text-gray-700 text-center">
        {trimmedName}
      </span>
    </button>
  );
}