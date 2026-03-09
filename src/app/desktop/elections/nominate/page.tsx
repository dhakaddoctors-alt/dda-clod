'use client';

import { useState, useTransition } from 'react';
import { submitNomination } from '@/app/actions/nominationActions';
import { UploadCloud, CheckCircle2, FileText } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';

export default function NominationPage() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [manifestoText, setManifestoText] = useState('');

  const ongoingElectionId = 'election_1'; // Hardcoded for demo
  const ongoingElectionTitle = 'National President Election 2026';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!manifestoText.trim()) {
       setMessage('Manifesto cannot be empty.');
       return;
    }

    const formData = new FormData(e.currentTarget);
    formData.append('electionId', ongoingElectionId);
    
    startTransition(async () => {
       const res = await submitNomination(formData);
       setMessage(res.message);
       setSuccess(res.success);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex flex-1 pt-16">
        <Sidebar />
        
        <main className="flex-1 lg:ml-64 p-4 lg:p-8 w-full">
          <div className="max-w-3xl mx-auto">
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
               <div className="mb-6 border-b border-gray-100 pb-6 text-center">
                 <h1 className="text-2xl font-bold text-gray-900 mb-2">Submit Nomination</h1>
                 <p className="text-gray-500">Apply to become a candidate for <strong className="text-blue-600">{ongoingElectionTitle}</strong>.</p>
               </div>

               {success ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Nomination Submitted!</h2>
                    <p className="text-gray-600 max-w-md mx-auto mb-8">
                       Your nomination application has been sent to the Election Committee for review. You will be notified once it is approved and the voting phase begins.
                    </p>
                    <Link href="/elections" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
                      Return to Election Hub
                    </Link>
                  </div>
               ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Election ID</label>
                      <input 
                         type="text" 
                         value={ongoingElectionId}
                         disabled
                         className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-mono"
                      />
                    </div>

                    <div>
                      <label htmlFor="posterFile" className="block text-sm font-semibold text-gray-900 mb-2">Candidate Poster (Banner Image)</label>
                      <div className="w-full flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-blue-500 transition-colors bg-gray-50 cursor-pointer">
                        <div className="space-y-2 text-center">
                          <UploadCloud className="mx-auto h-10 w-10 text-gray-400" />
                          <div className="flex text-sm text-gray-600 justify-center">
                            <label htmlFor="posterFile" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                              <span>Upload a poster</span>
                              <input id="posterFile" name="posterFile" type="file" required className="sr-only" accept="image/*" />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="manifesto" className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        Election Manifesto (Promises & Vision)
                      </label>
                      <textarea 
                        id="manifesto" 
                        name="manifesto"
                        rows={6}
                        required
                        value={manifestoText}
                        onChange={(e) => setManifestoText(e.target.value)}
                        placeholder="Detail your vision for the association. This will be publicly visible to voters."
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                      />
                    </div>

                    {message && (
                      <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                         {message}
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                       <Link href="/elections" className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors">
                         Cancel
                       </Link>
                       <button 
                         type="submit" 
                         disabled={isPending}
                         className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                       >
                         {isPending ? 'Submitting...' : 'Submit Nomination'}
                       </button>
                    </div>
                  </form>
               )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
