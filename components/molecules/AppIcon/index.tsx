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
  
  // Trim text to roughly fit two lines (about 24 characters)
  const trimText = (text: string) => {
    if (text.length <= 24) return text;
    
    const words = text.split(' ');
    let result = '';
    let currentLength = 0;
    
    for (const word of words) {
      if (currentLength + word.length + 1 <= 24) {
        result += (result ? ' ' : '') + word;
        currentLength += word.length + 1;
      } else {
        break;
      }
    }
    
    return result + (result.length < appName.length ? '...' : '');
  };

  const displayName = trimText(appName);

  return (
    <button
      onClick={() => onSelect?.(appURL, appId)}
      className="flex flex-col items-center gap-1 w-16"
    >
      <div className="w-10 h-10 flex items-center justify-center">
        {faviconUrl ? (
          <img 
            src={faviconUrl} 
            alt={`${appName} icon`}
            className="w-full h-full object-contain"
            onError={(e) => {
              const target = e.currentTarget;
              const parent = target.parentElement;
              if (parent) {
                parent.className = "w-10 h-10 flex items-center justify-center text-[#368564]";
                parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-xl font-semibold">${appName.charAt(0).toUpperCase()}</div>`;
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#368564] text-xl font-semibold">
            {appName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <span className="text-xs text-gray-700 text-center w-16 min-h-[2.5rem] whitespace-pre-wrap">
        {displayName}
      </span>
    </button>
  );
}