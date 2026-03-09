'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Building2, Vote, Calendar } from 'lucide-react';

export default function MobileTabBar() {
  const pathname = usePathname();

  const tabs = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Users, label: 'Directory', href: '/directory' },
    { icon: Building2, label: 'Committees', href: '/committees' },
    { icon: Vote, label: 'Elections', href: '/elections' },
    { icon: Calendar, label: 'Events', href: '/events' },
  ];

  return (
    <div className="lg:hidden block fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));
          return (
            <Link 
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center w-full h-full gap-1"
            >
              <tab.icon className={`w-6 h-6 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
