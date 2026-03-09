'use client';

import Link from 'next/link';
import { Menu, Search, Bell, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
  const { data: session } = useSession();
  const isAdmin = session?.user && ((session.user as any).role === 'admin' || (session.user as any).role === 'super_admin');
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

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
          
          {session ? (
            <div className="flex items-center gap-2 sm:gap-4">
              {isAdmin && (
                <Link 
                  href="/admin" 
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Admin Panel</span>
                </Link>
              )}
              
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-1 pr-3 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border border-blue-200">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{session.user?.name?.split(' ')[0]}</span>
                </button>
                
                {/* Click-based Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-[60] animate-in fade-in zoom-in duration-200">
                    <Link 
                      href="/profile" 
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      <span>My Profile</span>
                    </Link>
                    {isAdmin && (
                      <Link 
                        href="/admin" 
                        className="md:hidden flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Admin Panel</span>
                      </Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button 
                      onClick={() => {
                        setIsDropdownOpen(false);
                        signOut();
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link 
                href="/register" 
                className="hidden xs:flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-sm transition-all"
              >
                <span>Become a Member</span>
              </Link>
              <Link href="/login" className="flex items-center gap-2 p-1 pr-3 hover:bg-gray-100 rounded-full transition-colors">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <span className="hidden sm:block text-sm font-medium">Log In</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
