import { AuthorInfo } from '@/components/atoms/AuthorInfo';
import { RatingDisplay } from '@/components/molecules/RatingDisplay';
import { FavoriteButton } from '@/components/molecules/FavoriteButton';
import { Button } from '@/components/ui/button';
import { getFaviconUrl } from '@/lib/utils';
import type { AppDetails } from '@/lib/hooks/useApps';

interface AppCardProps {
  app: AppDetails;
  selected: boolean;
  onSelect: (appURL: string | null, appId: string, isGeneratedApp?: boolean) => void;
  showEditButton?: boolean;
}

export function AppCard({ app, selected, onSelect, showEditButton }: AppCardProps) {
  const faviconUrl = app.appURL ? getFaviconUrl(app.appURL) : null;

  return (
    <div className="w-full group relative">
      <div className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ${
        selected ? 'ring-2 ring-[#368564] ring-opacity-50' : ''
      }`}>
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
            <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden flex items-center justify-center">
              {faviconUrl ? (
                <img 
                  src={faviconUrl} 
                  alt={`${app.appName} icon`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.currentTarget;
                    const parent = target.parentElement;
                    if (parent) {
                      parent.className = "w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-[#e6efe9] flex items-center justify-center";
                      parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-[#368564] text-xl font-semibold">${app.appName.charAt(0).toUpperCase()}</div>`;
                    }
                  }}
                />
              ) : (
                <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-[#e6efe9] flex items-center justify-center">
                  <div className="w-full h-full flex items-center justify-center text-[#368564] text-xl font-semibold">
                    {app.appName.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate pr-8">
                    {app.appName}
                  </h2>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {app.categories.map((category) => (
                      <span 
                        key={category}
                        className="inline-flex items-center rounded-full bg-[#e6efe9] px-2 py-1 text-xs font-medium text-[#368564]"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
                <FavoriteButton appId={app.id} appData={app} />
              </div>
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                {app.description}
              </p>
              <div className="mt-3">
                <AuthorInfo name={app.authorMetadata.name} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <RatingDisplay app={app} />
                {showEditButton ? (
                  <Button
                    onClick={() => onSelect(app.appURL || null, app.id, app.isGeneratedApp)}
                    className="bg-[#368564] hover:bg-[#2a684d] text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                    </svg>
                    Edit App
                  </Button>
                ) : (
                  <Button
                    onClick={() => onSelect(app.appURL || null, app.id, app.isGeneratedApp)}
                    className="bg-[#368564] hover:bg-[#2a684d] text-white px-4 py-2 rounded-lg transition-all duration-300"
                  >
                    Launch App
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}