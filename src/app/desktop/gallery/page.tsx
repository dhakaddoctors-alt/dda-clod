import Navbar from '@/components/shared/Navbar';
import { Image as ImageIcon } from 'lucide-react';

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-16">
        <main className="flex-1 p-4 lg:p-8 w-full">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center py-20">
            <ImageIcon className="w-16 h-16 text-blue-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Photo Gallery</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              The official image gallery for past DDA events and memories is under construction. Stay tuned!
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
