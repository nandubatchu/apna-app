import { AuthorInfo } from '@/components/atoms/AuthorInfo';
import { RatingDisplay } from '@/components/molecules/RatingDisplay';
import type { AppDetails } from '@/lib/hooks/useApps';

interface AppCardProps {
    app: AppDetails;
    selected: boolean;
    onSelect: (appURL: string, appId: string) => void;
}

export function AppCard({ app, selected, onSelect }: AppCardProps) {
    return (
        <div className="group">
            <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                <button
                    className={`w-full text-left ${
                        selected ? 'ring-2 ring-[#368564] ring-opacity-50' : ''
                    }`}
                    onClick={() => onSelect(app.appURL, app.id)}
                >
                    <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-[#368564] transition-colors truncate">
                                    {app.appName}
                                </h2>
                                <p className="mt-2 text-sm text-gray-500 break-all line-clamp-2 sm:line-clamp-1">
                                    {app.appURL}
                                </p>
                                <div className="mt-3">
                                    <AuthorInfo name={app.authorMetadata.name} />
                                </div>
                            </div>
                            <RatingDisplay app={app} />
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
}