'use client';

import { useState } from 'react';
import { Search, ShieldAlert, Award, User, Filter, CheckSquare, Square } from 'lucide-react';
import ExportMembersPDFButton from '@/components/ui/ExportMembersPDFButton';
import ExportMembersButton from '@/components/ui/ExportMembersButton';
import AdminProfileControls from '@/components/ui/AdminProfileControls';
import ApproveRejectButtons from '@/components/ui/ApproveRejectButtons';
import Link from 'next/link';

interface AdminMemberManagerProps {
  initialUsers: any[];
  viewerRole: string;
}

export default function AdminMemberManager({ initialUsers, viewerRole }: AdminMemberManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [displayLimit, setDisplayLimit] = useState(10);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  const filteredUsers = initialUsers.filter((user) => {
    // Search
    const matchesSearch = 
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.mobile?.includes(searchTerm.toLowerCase());
    
    // Category Filter (Professional Identity)
    const matchesCategory = filterCategory === 'all' || 
                            user.category === filterCategory ||
                            (filterCategory === 'doctor' && !!user.doctorId) ||
                            (filterCategory === 'student' && !!user.studentId);

    // Role Filter (Admin Access)
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    // Status Filter (includes payment and deleted status)
    let matchesStatus = false;
    if (filterStatus === 'all') matchesStatus = true;
    else if (filterStatus === 'deleted') matchesStatus = user.isDeleted === 1;
    else if (filterStatus === 'pending') matchesStatus = user.paymentStatus === 'pending' && user.isDeleted === 0;
    else if (filterStatus === 'verified') matchesStatus = user.paymentStatus === 'verified' && user.isDeleted === 0;

    return matchesSearch && matchesCategory && matchesRole && matchesStatus;
  }).sort((a, b) => {
    // Sort by createdAt descending (newest first)
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  const displayedUsers = filteredUsers.slice(0, displayLimit);

  // Selection Handlers
  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllOnPage = () => {
    if (isAllSelected) {
      setSelectedIds([]);
      setIsAllSelected(false);
    } else {
      const allIds = filteredUsers.map(u => u.id);
      setSelectedIds(allIds);
      setIsAllSelected(true);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header & Filters */}
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col gap-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Master Member List</h2>
            <p className="text-sm text-gray-500">Manage all registered users, approve memberships, and change roles.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <ExportMembersPDFButton selectedIds={selectedIds} />
             <ExportMembersButton selectedIds={selectedIds} />
             <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
               {filteredUsers.length} Users Found
             </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setDisplayLimit(10); // Reset limit on search
                setSelectedIds([]);
                setIsAllSelected(false);
              }}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <select 
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setDisplayLimit(10); 
              setSelectedIds([]);
              setIsAllSelected(false);
            }}
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Identities</option>
            <option value="doctor">Doctors</option>
            <option value="student">Students</option>
            <option value="guest">Guests / Members</option>
          </select>
          <select 
            value={filterRole}
            onChange={(e) => {
              setFilterRole(e.target.value);
              setDisplayLimit(10); 
              setSelectedIds([]);
              setIsAllSelected(false);
            }}
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Access levels</option>
            <option value="member">Members</option>
            <option value="editor">Editors</option>
            <option value="admin">Admins</option>
            <option value="super_admin">Super Admins</option>
          </select>
          <select 
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setDisplayLimit(10); 
              setSelectedIds([]);
              setIsAllSelected(false);
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
              <th className="p-4 w-10">
                <input 
                  type="checkbox" 
                  checked={isAllSelected && filteredUsers.length > 0} 
                  onChange={handleSelectAllOnPage}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="p-4 font-semibold whitespace-nowrap">Member</th>
              <th className="p-4 font-semibold whitespace-nowrap">Contact</th>
              <th className="p-4 font-semibold whitespace-nowrap">Status</th>
              <th className="p-4 font-semibold text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayedUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <Filter className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="font-medium text-lg">No members found</p>
                    <p className="text-sm">Try adjusting your filters or search term.</p>
                  </div>
                </td>
              </tr>
            ) : (
              displayedUsers.map((user) => (
                <MemberTableRow 
                  key={user.id} 
                  user={user} 
                  viewerRole={viewerRole} 
                  isSelected={selectedIds.includes(user.id)}
                  onSelect={() => handleSelectOne(user.id)}
                />
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

function MemberTableRow({ user, viewerRole, isSelected, onSelect }: { user: any, viewerRole: string, isSelected: boolean, onSelect: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <tr className={`transition-colors group ${isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
        {/* Checkbox */}
        <td className="p-4 align-top">
          <input 
            type="checkbox" 
            checked={isSelected} 
            onChange={onSelect}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </td>

        {/* Name & Role */}
        <td className="p-4 align-top min-w-[200px]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
              user.isDeleted ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {user.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="font-bold text-gray-900 flex items-center gap-1.5 line-clamp-1">
                <Link href={`/directory/${user.id}`} className="hover:text-blue-600 hover:underline">
                  {user.fullName}
                </Link>
                {user.role === 'admin' && <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />}
                {user.role === 'super_admin' && <ShieldAlert className="w-3.5 h-3.5 text-red-600" />}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                   user.category === 'doctor' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                   user.category === 'student' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                   'bg-gray-50 text-gray-500 border border-gray-100'
                }`}>
                  {user.category || 'Guest'}
                </span>
                {user.role !== 'member' && (
                  <>
                    <span className="text-[10px] text-gray-300 mx-1">•</span>
                    <span className="text-[9px] font-bold text-purple-600 uppercase tracking-tighter bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                      {user.role}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </td>

        {/* Contact */}
        <td className="p-4 align-top min-w-[150px]">
          <div className="text-gray-900 font-medium truncate max-w-[150px]">{user.mobile || 'No Mobile'}</div>
          <div className="text-gray-500 text-xs mt-0.5 truncate max-w-[180px]">{user.email || 'No Email'}</div>
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
            className={`px-3 py-1.5 border text-xs font-semibold rounded-lg transition-all ${
              isExpanded 
                ? 'bg-gray-800 text-white border-gray-800 shadow-md' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            }`}
          >
            {isExpanded ? 'Close' : 'Manage'}
          </button>
        </td>
      </tr>

      {/* Expanded Row */}
      {isExpanded && (
        <tr className="bg-slate-50 border-b border-gray-200">
          <td colSpan={5} className="p-6">
            <div className="flex flex-col md:flex-row gap-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-xl max-w-4xl mx-auto">
              <div className="flex-1 w-full">
                 <AdminProfileControls 
                   profileId={user.id} 
                   isDeleted={user.isDeleted ?? 0}
                   currentRole={user.role} 
                   currentCategory={user.category}
                   viewerRole={viewerRole}
                 />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
