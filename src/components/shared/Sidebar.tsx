import Link from 'next/link';
import { Home, Users, Building2, Vote, Calendar, Image as ImageIcon } from 'lucide-react';
import InstallPWA from '@/components/ui/InstallPWA';

export default function Sidebar() {
  const menuItems = [
    { icon: Home, label: 'Home Feed', href: '/' },
    { icon: Users, label: 'Member Directory', href: '/directory' },
    { icon: Building2, label: 'Committees', href: '/committees' },
    { icon: Vote, label: 'Elections', href: '/elections' },
    { icon: Calendar, label: 'Events', href: '/events' },
    { icon: ImageIcon, label: 'Gallery', href: '/gallery' },
  ];

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto hidden lg:block hover:overflow-y-auto custom-scrollbar">
      <div className="p-4">
        <div className="space-y-1">
          {menuItems.map((item, idx) => (
            <Link 
              key={idx} 
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition-colors"
            >
              <item.icon className="w-6 h-6 text-blue-600" />
              {item.label}
            </Link>
          ))}
        </div>
        
        <InstallPWA />
        
        <hr className="my-4 border-gray-200" />
        
        <div className="px-3">
          <h3 className="text-gray-500 text-sm font-semibold mb-3">Shortcuts</h3>
          <div className="space-y-2">
             <Link href="/register" className="block text-sm text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-lg">Register as Doctor</Link>
             <Link href="/register" className="block text-sm text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-lg">Register as Student</Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
