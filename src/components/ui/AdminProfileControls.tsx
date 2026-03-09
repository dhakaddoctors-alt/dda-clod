'use client';

import { useTransition, useState } from 'react';
import { softDeleteUser, restoreUser, changeUserRole } from '@/app/actions/adminActions';
import { Trash2, UserPlus, ShieldAlert } from 'lucide-react';

interface AdminProfileControlsProps {
  profileId: string;
  isDeleted: number; // 0 for active, 1 for deleted
  currentRole: string;
}

export default function AdminProfileControls({ profileId, isDeleted, currentRole }: AdminProfileControlsProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState(currentRole);

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
      
      {message && <div className="mb-3 text-sm font-medium text-gray-700 bg-gray-50 p-2 rounded border border-gray-100">{message}</div>}

      {/* Role Management Section */}
      {isDeleted === 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Manage Role</label>
          <div className="flex gap-2">
            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              disabled={isPending}
              className="flex-1 bg-white border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            >
              <option value="guest">Guest</option>
              <option value="student">Student</option>
              <option value="doctor">Doctor</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <button
              onClick={() => {
                if(selectedRole === currentRole) return;
                startTransition(async () => {
                  const res = await changeUserRole(profileId, selectedRole);
                  setMessage(res.message);
                });
              }}
              disabled={isPending || selectedRole === currentRole}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Update
            </button>
          </div>
        </div>
      )}

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
