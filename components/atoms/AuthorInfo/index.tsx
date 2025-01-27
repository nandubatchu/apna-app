import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface AuthorInfoProps {
    name?: string;
}

export function AuthorInfo({ name }: AuthorInfoProps) {
    return (
        <div className="flex items-center">
            <Avatar className="h-7 w-7 sm:h-6 sm:w-6">
                <AvatarFallback className="bg-[#e6efe9] text-[#368564] text-xs">
                    {name?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
            </Avatar>
            <p className="ml-2 text-sm font-medium text-gray-600 truncate">
                {name || 'Anonymous'}
            </p>
        </div>
    );
}