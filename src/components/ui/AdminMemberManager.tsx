'use client';

import { useState } from 'react';
import { Search, ShieldAlert, Award, User, Filter } from 'lucide-react';
import AdminProfileControls from '@/components/ui/AdminProfileControls';
import ApproveRejectButtons from '@/components/ui/ApproveRejectButtons';
import Link from 'next/link';

interface AdminMemberManagerProps {
  initialUsers: any[];
}

export default function AdminMemberManager({ initialUsers }: AdminMemberManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [displayLimit, setDisplayLimit] = useState(10);

  const filteredUsers = initialUsers.filter((user) => {
    // Search
    const matchesSearch = 
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.mobile?.includes(searchTerm.toLowerCase());
    
    // Role Filter
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    // Status Filter (includes payment and deleted status)
    let matchesStatus = false;
    if (filterStatus === 'all') matchesStatus = true;
    else if (filterStatus === 'deleted') matchesStatus = user.isDeleted === 1;
    else if (filterStatus === 'pending') matchesStatus = user.paymentStatus === 'pending' && user.isDeleted === 0;
    else if (filterStatus === 'verified') matchesStatus = user.paymentStatus === 'verified' && user.isDeleted === 0;

    return matchesSearch && matchesRole && matchesStatus;
  }).sort((a, b) => {
    // Sort by createdAt descending (newest first)
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  const displayedUsers = filteredUsers.slice(0, displayLimit);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header & Filters */}
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Master Member List</h2>
            <p className="text-sm text-gray-500">Manage all registered users, approve memberships, and change roles.</p>
          </div>
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
            {filteredUsers.length} Users Found
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name, email, or mobile..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setDisplayLimit(10); // Reset limit on search
              }}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <select 
            value={filterRole}
            onChange={(e) => {
              setFilterRole(e.target.value);
              setDisplayLimit(10); // Reset limit on filter
            }}
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="doctor">Doctors</option>
            <option value="student">Students</option>
            <option value="guest">Guests</option>
          </select>
          <select 
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setDisplayLimit(10); // Reset limit on filter
            }}
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="verified">Verified / Active</option>
            <option value="pending">Pending Approval</option>
            <option value="deleted">Soft-Deleted</option>
          </select>
        </div>
      </div>

      {/* User Table List */}
      <div className="overflow-x-auto overflow-y-auto max-h-[800px] custom-scrollbar">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs sticky top-0 z-10 border-y border-gray-100 shadow-sm">
            <tr>
              <th className="p-4 font-semibold whitespace-nowrap">Member</th>
              <th className="p-4 font-semibold whitespace-nowrap">Contact</th>
              <th className="p-4 font-semibold whitespace-nowrap">Status</th>
              <th className="p-4 font-semibold text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayedUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <Filter className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="font-medium text-lg">No members found</p>
                    <p className="text-sm">Try adjusting your filters or search term.</p>
                  </div>
                </td>
              </tr>
            ) : (
              displayedUsers.map((user) => (
                <MemberTableRow key={user.id} user={user} />
              ))
            )}
          </tbody>
        </table>

        {filteredUsers.length > displayedUsers.length && (
          <div className="p-6 text-center bg-gray-50 border-t border-gray-100">
            <button 
              onClick={() => setDisplayLimit(prev => prev + 10)}
              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors shadow-sm"
            >
              Show More Members
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MemberTableRow({ user }: { user: any }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <tr className="hover:bg-slate-50 transition-colors group">
        {/* Name & Role */}
        <td className="p-4 align-top min-w-[200px]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
              user.isDeleted ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {user.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="font-bold text-gray-900 flex items-center gap-1.5">
                <Link href={`/directory/${user.id}`} className="hover:text-blue-600 hover:underline">
                  {user.fullName}
                </Link>
                {user.role === 'admin' && <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />}
              </div>
              <span className="text-xs font-medium text-gray-500 capitalize">{user.role}</span>
            </div>
          </div>
        </td>

        {/* Contact */}
        <td className="p-4 align-top min-w-[150px]">
          <div className="text-gray-900 font-medium">{user.mobile || 'No Mobile'}</div>
          <div className="text-gray-500 text-xs mt-0.5">{user.email || 'No Email'}</div>
        </td>

        {/* Status & Quick Actions */}
        <td className="p-4 align-top">
          <div className="flex flex-col items-start gap-2">
            <div className="flex items-center gap-2">
              {user.isDeleted === 1 ? (
                <span className="bg-red-100 text-red-700 px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                  Deleted
                </span>
              ) : (
                <ApproveRejectButtons profileId={user.id} currentStatus={user.paymentStatus} />
              )}
              
              {user.paymentReceiptUrl && (
                <a href={user.paymentReceiptUrl} target="_blank" className="text-[11px] text-blue-600 hover:underline font-medium ml-2" rel="noreferrer">
                  Receipt
                </a>
              )}
            </div>
          </div>
        </td>

        {/* Actions */}
        <td className="p-4 align-top text-right">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-3 py-1.5 border text-xs font-semibold rounded-lg transition-colors ${
              isExpanded 
                ? 'bg-gray-800 text-white border-gray-800' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {isExpanded ? 'Close' : 'Manage'}
          </button>
        </td>
      </tr>

      {/* Expanded Row */}
      {isExpanded && (
        <tr className="bg-slate-50 border-b border-gray-200 shadow-inner">
          <td colSpan={4} className="p-6">
            <div className="flex flex-col md:flex-row gap-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm max-w-4xl">
              {/* Profile Level Controls only */}
              <div className="flex-1 w-full">
                 <AdminProfileControls 
                   profileId={user.id} 
                   isDeleted={user.isDeleted ?? 0}
                   currentRole={user.role} 
                 />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
