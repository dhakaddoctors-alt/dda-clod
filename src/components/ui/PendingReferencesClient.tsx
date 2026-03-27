'use client';

import { useState, useTransition } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { respondToReference } from '@/app/actions/nominationActions';
import { toast } from 'react-hot-toast';

interface PendingRef {
  id: string;
  electionId: string;
  electionTitle: string;
  electionLevel: string;
  electionPost: string | null;
  candidateId: string;
  candidateName: string;
  candidateCategory: string;
  roleAs: string;
  refStatus: string;
}

export default function PendingReferencesClient({ requests }: { requests: PendingRef[] }) {
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (!requests || requests.length === 0) return null;

  const handleResponse = async (candidateId: string, roleAs: string, action: 'approve' | 'reject') => {
    if (action === 'reject') {
      if (!window.confirm('Are you sure you want to reject this nomination request? The candidate will have to find a new reference.')) {
        return;
      }
    }
    
    setProcessingId(candidateId);
    try {
      const res = await respondToReference(candidateId, roleAs as 'Proposer' | 'Seconder', action);
      if (res.success) {
        toast.success(res.message);
        // Page will refresh natively due to revalidatePath
      } else {
        toast.error(res.message);
      }
    } catch (e) {
      toast.error('An error occurred.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-orange-50/50 border border-orange-200 rounded-2xl p-6 shadow-sm mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-orange-100 p-2.5 rounded-xl text-orange-600">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Action Required: Nomination References</h2>
          <p className="text-sm text-gray-600 mt-1">
            The following members have selected you as a reference for their election nomination. 
            Their nomination cannot proceed without your approval.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {requests.map((req) => (
          <div key={req.id} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  {req.roleAs} Request
                </span>
                <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  {req.electionLevel === 'national' ? 'National' : req.electionLevel}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mt-2">
                {req.candidateName} <span className="text-gray-500 font-medium text-sm">({req.candidateCategory})</span>
              </h3>
              <p className="text-gray-600 mt-1">
                Nominated for <span className="font-semibold text-gray-800">{req.electionPost || 'General Position'}</span> in {req.electionTitle}
              </p>
            </div>
            
            <div className="flex flex-row gap-2 shrink-0">
              <button 
                onClick={() => handleResponse(req.id, req.roleAs, 'reject')}
                disabled={processingId === req.id}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                <XCircle className="w-5 h-5" />
                Reject
              </button>
              <button 
                onClick={() => handleResponse(req.id, req.roleAs, 'approve')}
                disabled={processingId === req.id}
                className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 shadow-sm"
              >
                {processingId === req.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                Approve
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
