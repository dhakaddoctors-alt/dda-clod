'use client';

import { useTransition, useState } from 'react';
import { softDeleteUser, restoreUser, changeUserRole, changeUserCategory } from '@/app/actions/adminActions';
import { Trash2, UserPlus, ShieldAlert, GraduationCap, Stethoscope, User } from 'lucide-react';

interface AdminProfileControlsProps {
  profileId: string;
  isDeleted: number; // 0 for active, 1 for deleted
  currentRole: string;
  currentCategory: string;
  viewerRole: string;
}

export default function AdminProfileControls({ profileId, isDeleted, currentRole, currentCategory, viewerRole }: AdminProfileControlsProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [selectedCategory, setSelectedCategory] = useState(currentCategory);

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
      <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center justify-between">
         <span className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-gray-400" />
            Admin Control Zone
         </span>
         {isDeleted === 1 && <span className="text-[10px] bg-red-100 text-red-700 px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">Deleted Account</span>}
      </h4>
      
      {message && <div className="mb-4 text-xs font-bold text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-100 animate-pulse">{message}</div>}

      {isDeleted === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Identity Category Management - ONLY FOR ADMINS CP */}
          {(viewerRole === 'admin' || viewerRole === 'super_admin') ? (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <label className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase mb-3 tracking-widest">
                <User className="w-3 h-3" />
                Professional Identity
              </label>
              <div className="flex gap-2">
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={isPending}
                  className="flex-1 bg-white border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 outline-none p-2.5 transition-all text-sm font-medium"
                >
                  <option value="guest">Guest / Member</option>
                  <option value="student">Medical Student</option>
                  <option value="doctor">Doctor</option>
                </select>
                <button
                  onClick={() => {
                    if(selectedCategory === currentCategory) return;
                    startTransition(async () => {
                      const res = await changeUserCategory(profileId, selectedCategory);
                      setMessage(res.message);
                    });
                  }}
                  disabled={isPending || selectedCategory === currentCategory}
                  className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-30 transition-all shadow-sm"
                  title="Update Category"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 flex items-center justify-center text-center opacity-60">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Identity Locked for Editors</p>
            </div>
          )}

          {/* Access Role Management */}
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
            <label className="flex items-center gap-2 text-[10px] font-bold text-purple-600 uppercase mb-3 tracking-widest">
              <ShieldAlert className="w-3 h-3" />
              Administrative Role
            </label>
            <div className="flex gap-2">
              <select 
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={isPending}
                className="flex-1 bg-white border border-purple-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-purple-500 outline-none p-2.5 transition-all text-sm font-medium"
              >
                <option value="member">Normal Member</option>
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
                className="p-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-30 transition-all shadow-sm"
                title="Update Role"
              >
                <ShieldAlert className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {isDeleted === 0 ? (
          <button 
            onClick={handleDelete}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-red-50 text-red-600 font-bold rounded-xl text-xs transition-all border border-red-100 hover:border-red-200 disabled:opacity-50 tracking-wider uppercase"
          >
            <Trash2 className="w-4 h-4" />
            {isPending ? 'Processing...' : 'Delete Public Profile'}
          </button>
        ) : (
          <button 
             onClick={handleRestore}
             disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-green-50 text-green-600 font-bold rounded-xl text-xs transition-all border border-green-100 hover:border-green-200 disabled:opacity-50 tracking-wider uppercase"
          >
            <UserPlus className="w-4 h-4" />
            {isPending ? 'Processing...' : 'Restore Profile'}
          </button>
        )}
      </div>
    </div>
  );
}
