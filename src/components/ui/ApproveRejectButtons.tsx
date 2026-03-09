'use client';

import { useState, useTransition } from 'react';
import { approveUser, rejectUser } from '@/app/actions/adminActions';
import { Check, X, ShieldOff, Award } from 'lucide-react';

export default function ApproveRejectButtons({ profileId, currentStatus = 'pending' }: { profileId: string, currentStatus?: string }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<null | 'approved' | 'rejected' | 'unverified'>(null);

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

  const handleUnverify = () => {
    if (confirm('Are you sure you want to revoke verification and set this member to pending?')) {
      startTransition(async () => {
        const res = await rejectUser(profileId); // Using rejectUser which sets paymentStatus to 'pending'
        if (res.success) setStatus('unverified');
        else alert(res.message);
      });
    }
  };

  if (status === 'approved' || (status === null && currentStatus === 'verified')) {
    return (
      <button 
        onClick={handleUnverify}
        disabled={isPending}
        className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-green-200 active:scale-95"
        title="Click to Unverify this member"
      >
        <Award className="w-4 h-4" /> 
        {isPending ? 'Updating...' : 'Verified'}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={handleApprove}
        disabled={isPending}
        className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-yellow-200 shadow-sm active:scale-95"
        title="Click to Approve this member"
      >
        {isPending ? <span className="animate-pulse">Processing...</span> : <>Approve</>}
      </button>
      
      <button 
        onClick={handleReject} 
        disabled={isPending}
        className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors border border-red-100"
        title="Reject Registration"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
