'use client';

import { useState } from 'react';
import { CalendarClock, Save, Loader2 } from 'lucide-react';
import { updateElectionSchedule } from '@/app/actions/electionActions';
import { toast } from 'react-hot-toast';

interface ElectionSettings {
  id: string;
  nominationStartDate: Date | null;
  nominationEndDate: Date | null;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
}

// Helper to convert Date to YYYY-MM-DDThh:mm for datetime-local input
const toDatetimeLocal = (date: Date | null) => {
  if (!date) return '';
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

export default function ElectionConfigPanel({ election }: { election: ElectionSettings | null }) {
  const [loading, setLoading] = useState(false);
  const [dates, setDates] = useState({
    nominationStartDate: toDatetimeLocal(election?.nominationStartDate || null),
    nominationEndDate: toDatetimeLocal(election?.nominationEndDate || null),
    startDate: toDatetimeLocal(election?.startDate || null),
    endDate: toDatetimeLocal(election?.endDate || null),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDates({ ...dates, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!election?.id) return;
    setLoading(true);

    try {
      const config = {
        nominationStartDate: dates.nominationStartDate ? new Date(dates.nominationStartDate) : null,
        nominationEndDate: dates.nominationEndDate ? new Date(dates.nominationEndDate) : null,
        startDate: dates.startDate ? new Date(dates.startDate) : null,
        endDate: dates.endDate ? new Date(dates.endDate) : null,
      };

      const result = await updateElectionSchedule(election.id, config);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8 mt-8">
      <div className="flex items-center gap-2 mb-6">
        <CalendarClock className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-bold text-gray-900">Election Timeline Settings</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Nomination Phase */}
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
          <h3 className="text-md font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">Nomination Phase</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nominations Open</label>
              <input
                type="datetime-local"
                name="nominationStartDate"
                value={dates.nominationStartDate}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nominations Close</label>
              <input
                type="datetime-local"
                name="nominationEndDate"
                value={dates.nominationEndDate}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Voting Phase */}
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
          <h3 className="text-md font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">Voting Phase (Gupt Matdaan)</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Voting Opens (Start Date)</label>
              <input
                type="datetime-local"
                name="startDate"
                value={dates.startDate}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Voting Closes (End Date)</label>
              <input
                type="datetime-local"
                name="endDate"
                value={dates.endDate}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading || !election?.id}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Election Timeline
        </button>
      </div>
    </div>
  );
}
