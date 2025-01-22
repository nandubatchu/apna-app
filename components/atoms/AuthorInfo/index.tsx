import { Avatar, AvatarFallback } from '@radix-ui/react-avatar';

interface AuthorInfoProps {
    name?: string;
}

export function AuthorInfo({ name }: AuthorInfoProps) {
    return (
        <div className="flex items-center">
            <Avatar className="h-7 w-7 sm:h-6 sm:w-6 rounded-full bg-[#e6efe9]">
                <AvatarFallback className="text-[#368564]">
                    {name?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
            </Avatar>
            <p className="ml-2 text-sm font-medium text-gray-600 truncate">
                {name || 'Anonymous'}
            </p>
        </div>
    );
}