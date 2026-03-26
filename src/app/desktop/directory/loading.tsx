import Navbar from '@/components/shared/Navbar';
import { Search } from 'lucide-react';

export default function DirectoryLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex flex-1 pt-16">
        <main className="flex-1 p-4 lg:p-8 w-full">
          <div className="max-w-6xl mx-auto">
            {/* Header & Smart Search Skeleton */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <div className="h-12 bg-gray-100 rounded-xl w-full"></div>
                </div>
                <div className="h-12 w-12 md:w-auto md:px-6 bg-blue-100 rounded-xl"></div>
              </div>
            </div>

            {/* Content Tabs Skeleton */}
            <div className="flex gap-2 mb-6 animate-pulse">
               <div className="h-10 bg-blue-600 rounded-xl w-24"></div>
               <div className="h-10 bg-white border border-gray-200 rounded-xl w-32"></div>
               <div className="h-10 bg-white border border-gray-200 rounded-xl w-32"></div>
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
                  <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
                    <div className="absolute -bottom-10 left-6 w-20 h-20 rounded-full bg-gray-200 border-4 border-white"></div>
                  </div>
                  <div className="pt-12 p-6 flex-1 flex flex-col">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-100 rounded w-1/2 mb-4"></div>
                    
                    <div className="space-y-3 mt-2 flex-1">
                      <div className="h-4 bg-gray-50 rounded w-full"></div>
                      <div className="h-4 bg-gray-50 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-50 rounded w-4/6"></div>
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-2">
                    <div className="flex-1 h-10 bg-white rounded-xl border border-gray-200"></div>
                    <div className="flex-1 h-10 bg-white rounded-xl border border-gray-200"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
