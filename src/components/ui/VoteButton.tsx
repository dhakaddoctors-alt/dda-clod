'use client';

import { useState, useTransition } from 'react';
import { castVote } from '@/app/actions/electionActions';
import { CheckCircle2 } from 'lucide-react';

export default function VoteButton({ candidateId, electionId, candidateName }: { candidateId: string, electionId: string, candidateName: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleVote = () => {
    if (confirm(`Are you sure you want to vote for ${candidateName}? This action cannot be undone.`)) {
      const formData = new FormData();
      formData.append('candidateId', candidateId);
      formData.append('electionId', electionId);
      
      startTransition(async () => {
        const res = await castVote(formData);
        setMessage(res.message);
        setSuccess(res.success);
      });
    }
  };

  return (
    <div className="mt-6 w-full relative">
      <button 
        onClick={handleVote}
        disabled={isPending || success}
        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all group ${
          success ? 'bg-green-100 text-green-700 cursor-not-allowed border border-green-300' :
          isPending ? 'bg-blue-400 text-white cursor-not-allowed' :
          'bg-blue-600 hover:bg-blue-700 text-white hover:scale-[1.02]'
        }`}
      >
        <CheckCircle2 className={`w-5 h-5 ${success ? 'text-green-600' : isPending ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
        {success ? 'Voted Successfully' : isPending ? 'Processing...' : `Vote for ${candidateName.split(' ')[1]}`}
      </button>

      {message && (
        <p className={`mt-3 text-sm text-center font-medium ${success ? 'text-green-600' : 'text-red-500'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
