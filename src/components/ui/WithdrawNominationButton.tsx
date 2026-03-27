'use client';

import { useState, useTransition } from 'react';
import { withdrawNomination } from '@/app/actions/nominationActions';
import { Trash2 } from 'lucide-react';

interface WithdrawNominationButtonProps {
  candidateId: string;
}

export default function WithdrawNominationButton({ candidateId }: WithdrawNominationButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState('');

  const handleWithdraw = async () => {
    if (!confirm('Are you sure you want to withdraw your nomination? This action cannot be undone.')) return;

    startTransition(async () => {
      const res = await withdrawNomination(candidateId);
      if (!res.success) {
        setMsg(res.message);
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleWithdraw}
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-200 border border-red-500/30 rounded-xl font-bold shadow-sm transition-colors disabled:opacity-50"
      >
        <Trash2 className="w-5 h-4" />
        {isPending ? 'Withdrawing...' : 'Withdraw Nomination'}
      </button>
      {msg && <p className="text-xs text-red-400 font-medium">{msg}</p>}
    </div>
  );
}
