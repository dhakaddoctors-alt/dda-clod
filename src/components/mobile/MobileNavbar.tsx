'use client';

import Link from 'next/link';
import { Search, Bell, User, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';

export default function MobileNavbar() {
  const { data: session } = useSession();
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
    <nav className="fixed top-0 w-full bg-white border-b border-gray-200 z-50 h-14">
      <div className="flex items-center justify-between px-4 h-full">
        {/* Left Side: Logo */}
        <Link href="/" className="text-xl font-bold text-blue-600 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-lg">D</div>
          <span className="font-semibold text-lg">DDA Portal</span>
        </Link>
        
        {/* Right Side: Actions */}
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Search className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          
          {session ? (
             <div className="relative" ref={dropdownRef}>
               <button 
                 onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                 className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 border border-blue-200 overflow-hidden"
               >
                 <User className="w-5 h-5 text-blue-600" />
               </button>
               {/* Click-based Dropdown for Mobile */}
               {isDropdownOpen && (
                 <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in duration-200">
                   <Link 
                     href="/profile" 
                     className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50"
                     onClick={() => setIsDropdownOpen(false)}
                   >
                     <User className="w-4 h-4" />
                     <span>My Profile</span>
                   </Link>
                   <button 
                     onClick={() => {
                       setIsDropdownOpen(false);
                       signOut();
                     }}
                     className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                   >
                     <LogOut className="w-4 h-4" />
                     <span>Sign Out</span>
                   </button>
                 </div>
               )}
             </div>
          ) : (
             <Link href="/login" className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200">
               <User className="w-5 h-5 text-gray-500" />
             </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
