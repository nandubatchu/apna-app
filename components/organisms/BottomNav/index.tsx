"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, AppsIcon } from './icons';

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom">
      <div className="max-w-md mx-auto px-4">
        <div className="flex justify-around h-16">
          <Link 
            href="/"
            className={`flex flex-col items-center justify-center w-full ${
              pathname === '/' ? 'text-[#368564]' : 'text-gray-500'
            }`}
          >
            <HomeIcon filled={pathname === '/'} />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link
            href="/explore"
            className={`flex flex-col items-center justify-center w-full ${
              pathname === '/explore' ? 'text-[#368564]' : 'text-gray-500'
            }`}
          >
            <AppsIcon filled={pathname === '/explore'} />
            <span className="text-xs mt-1">Explore</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}