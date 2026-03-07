'use client';

import { useTransition, useState } from 'react';
import { softDeleteUser, restoreUser } from '@/app/actions/adminActions';
import { Trash2, UserPlus } from 'lucide-react';

interface AdminProfileControlsProps {
  profileId: string;
  isDeleted: number; // 0 for active, 1 for deleted
}

export default function AdminProfileControls({ profileId, isDeleted }: AdminProfileControlsProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');

  const handleDelete = () => {
    if (!confirm('Are you sure you want to soft delete this member? They will be hidden from the directory.')) return;
    
    startTransition(async () => {
      const res = await softDeleteUser(profileId);
      setMessage(res.message);
    });
  };

  const handleRestore = () => {
    if (!confirm('Restore this member to active status?')) return;
    
    startTransition(async () => {
      const res = await restoreUser(profileId);
      setMessage(res.message);
    });
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-100">
      <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
         Admin Zone
         {isDeleted === 1 && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full uppercase tracking-wide">Deleted Account</span>}
      </h4>
      
      {message && <div className="mb-3 text-sm font-medium text-gray-700">{message}</div>}

      <div className="flex flex-col gap-2">
        {isDeleted === 0 ? (
          <button 
            onClick={handleDelete}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg text-sm transition-colors border border-red-200 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {isPending ? 'Processing...' : 'Soft Delete Member'}
          </button>
        ) : (
          <button 
             onClick={handleRestore}
             disabled={isPending}
             className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-green-50 hover:bg-green-100 text-green-700 font-semibold rounded-lg text-sm transition-colors border border-green-200 disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            {isPending ? 'Processing...' : 'Restore Member'}
          </button>
        )}
      </div>
    </div>
  );
}
