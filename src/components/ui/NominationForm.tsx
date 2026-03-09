'use client';

import { useState, useTransition } from 'react';
import { submitNomination } from '@/app/actions/nominationActions';
import { UploadCloud, CheckCircle2, FileText, AlertCircle, CalendarClock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Election {
  id: string;
  title: string;
  level: string;
  locationName: string | null;
  nominationStartDate: Date | null;
  nominationEndDate: Date | null;
}

interface NominationFormProps {
  election: Election | null;
  allElections: Election[];
  phaseStatus: string;
  nomStart: Date | null;
  nomEnd: Date | null;
}

export default function NominationForm({ election, allElections, phaseStatus, nomStart, nomEnd }: NominationFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [manifestoText, setManifestoText] = useState('');
  const [selectedElectionId, setSelectedElectionId] = useState(election?.id || '');

  const ongoingElectionId = selectedElectionId;
  const selectedElectionObj = allElections.find((e) => e.id === selectedElectionId) || election;
  const ongoingElectionTitle = selectedElectionObj?.title || 'National President Election';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!manifestoText.trim()) {
      setMessage('Manifesto cannot be empty.');
      return;
    }
    if (!ongoingElectionId) {
      setMessage('Please select an election first.');
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
       <div className="mb-6 border-b border-gray-100 pb-6 text-center">
         <h1 className="text-2xl font-bold text-gray-900 mb-2">Submit Nomination</h1>
         <p className="text-gray-500">Apply to become a candidate for <strong className="text-blue-600">{ongoingElectionTitle}</strong>.</p>
       </div>

       {phaseStatus === 'not_scheduled' && (
          <div className="text-center py-12">
             <CalendarClock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
             <h2 className="text-xl font-bold text-gray-900 mb-2">Nominations Not Scheduled</h2>
             <p className="text-gray-500 mb-6">The administration has not yet published the nomination schedule for this election.</p>
             <Link href="/elections" className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors">Go Back</Link>
          </div>
       )}

       {phaseStatus === 'upcoming' && (
          <div className="text-center py-12">
             <AlertCircle className="w-16 h-16 text-blue-500 mx-auto mb-4" />
             <h2 className="text-xl font-bold text-blue-900 mb-2">Nominations Not Open Yet</h2>
             <p className="text-gray-500 mb-6">The nomination window will open on <strong className="text-gray-800">{nomStart?.toLocaleString()}</strong>.</p>
             <Link href="/elections" className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors">Go Back</Link>
          </div>
       )}

       {phaseStatus === 'closed' && (
          <div className="text-center py-12">
             <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
             <h2 className="text-xl font-bold text-red-900 mb-2">Nominations Closed</h2>
             <p className="text-gray-500 mb-6">The deadline for submitting nominations ended on <strong className="text-gray-800">{nomEnd?.toLocaleString()}</strong>.</p>
             <Link href="/elections" className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors">Go Back</Link>
          </div>
       )}

       {phaseStatus === 'open' && (
          <>
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
              <label className="block text-sm font-semibold text-gray-900 mb-2">Select Election Tier <span className="text-red-500">*</span></label>
              <select 
                 value={selectedElectionId}
                 onChange={(e) => setSelectedElectionId(e.target.value)}
                 className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                 required
              >
                 <option value="" disabled>Select the election you are contesting for...</option>
                 {allElections.map((e) => (
                    <option key={e.id} value={e.id}>
                       {e.title} ({e.level === 'national' ? 'National Tier' : `${e.locationName} Tier`})
                    </option>
                 ))}
              </select>
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
                Election Manifesto (Promises &amp; Vision)
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
          </>
       )}
    </div>
  );
}
