import Navbar from '@/components/shared/Navbar';
import { Calendar } from 'lucide-react';

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-16">
        <main className="flex-1 p-4 lg:p-8 w-full">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center py-20">
            <Calendar className="w-16 h-16 text-blue-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Upcoming Events</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Our community calendar is currently being updated. Check back soon for the latest medical camps, conferences, and association meetings.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
