'use client';

import { useState } from 'react';
import { createNewElection } from '@/app/actions/electionActions';
import { PlusCircle, Loader2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CreateElectionModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [level, setLevel] = useState('national');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const res = await createNewElection(formData);
      
      if (res.success) {
        toast.success(res.message);
        onClose();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error('Failed to create election.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            Create New Election
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-1">Election Title <span className="text-red-500">*</span></label>
             <input type="text" name="title" required placeholder="e.g. Rajasthan State President 2026" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
             <textarea name="description" rows={3} placeholder="Briefly describe the purpose of this election..." className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-1">Organizational Level</label>
             <select 
               name="level" 
               value={level} 
               onChange={(e) => setLevel(e.target.value)}
               className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
             >
               <option value="national">National (Central Committee)</option>
               <option value="state">State Level</option>
               <option value="district">District Level</option>
             </select>
          </div>

          {level !== 'national' && (
             <div>
               <label className="block text-sm font-semibold text-gray-700 mb-1">Location Name <span className="text-red-500">*</span></label>
               <input type="text" name="locationName" required placeholder={level === 'state' ? "e.g. Madhya Pradesh" : "e.g. Indore"} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
             </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
             <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors">
               Cancel
             </button>
             <button type="submit" disabled={loading} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center gap-2">
               {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
               {loading ? 'Creating...' : 'Create Election'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
