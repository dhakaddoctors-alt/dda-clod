import Link from 'next/link';
import { Menu, Search, Bell, User } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full bg-white border-b border-gray-200 z-50 h-16">
      <div className="flex items-center justify-between px-4 h-full">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-full lg:hidden">
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <Link href="/" className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">D</div>
            <span className="hidden sm:block">DDA Portal</span>
          </Link>
          
          {/* Search Bar - Facebook Style */}
          <div className="hidden md:flex items-center relative ml-4">
            <Search className="w-4 h-4 text-gray-500 absolute left-3" />
            <input 
              type="text" 
              placeholder="Search members, doctors, updates..." 
              className="bg-gray-100 rounded-full py-2 pl-10 pr-4 w-[280px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-full relative">
            <Bell className="w-6 h-6 text-gray-600" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          
          <Link href="/login" className="flex items-center gap-2 p-1 pr-3 hover:bg-gray-100 rounded-full transition-colors">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              <User className="w-5 h-5 text-gray-500" />
            </div>
            <span className="hidden sm:block text-sm font-medium">Log In</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
