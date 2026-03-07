'use client';

import { useState, useTransition } from 'react';
import { approveUser, rejectUser } from '@/app/actions/adminActions';
import { Check, X } from 'lucide-react';

export default function ApproveRejectButtons({ profileId }: { profileId: string }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<null | 'approved' | 'rejected'>(null);

  const handleApprove = () => {
    startTransition(async () => {
      const res = await approveUser(profileId);
      if (res.success) setStatus('approved');
      else alert(res.message);
    });
  };

  const handleReject = () => {
    if (confirm('Are you sure you want to reject this registration?')) {
      startTransition(async () => {
        const res = await rejectUser(profileId);
        if (res.success) setStatus('rejected');
        else alert(res.message);
      });
    }
  };

  if (status === 'approved') return <span className="text-sm font-bold text-green-600">Approved</span>;
  if (status === 'rejected') return <span className="text-sm font-bold text-red-600">Rejected</span>;
  if (isPending) return <span className="text-sm text-gray-500 font-medium animate-pulse">Processing...</span>;

  return (
    <div className="flex gap-2 w-full sm:w-auto">
      <button 
        onClick={handleReject} 
        disabled={isPending}
        className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
      >
        <X className="w-4 h-4" /> Reject
      </button>
      <button 
        onClick={handleApprove} 
        disabled={isPending}
        className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
      >
        <Check className="w-4 h-4" /> Approve
      </button>
    </div>
  );
}
