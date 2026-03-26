'use client';

import { useState, useTransition } from 'react';
import { adminUpdateCandidateStatus, adminDeleteCandidate } from '@/app/actions/electionActions';
import { Check, X, Trash2, ExternalLink, ShieldAlert, FileText, UserCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

export default function AdminCandidateManager({ 
  electionId, 
  candidates = [] 
}: { 
  electionId: string, 
  candidates: any[] 
}) {
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (candidateId: string, newStatus: 'approved' | 'rejected') => {
    startTransition(async () => {
      const res = await adminUpdateCandidateStatus(candidateId, newStatus);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  const handleDelete = (candidateId: string) => {
    if (!confirm('Are you sure you want to permanently delete this candidate? This will also remove any votes they have collected.')) return;
    startTransition(async () => {
      const res = await adminDeleteCandidate(candidateId);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  if (candidates.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center mt-8">
        <UserCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">No Candidates Yet</h3>
        <p className="text-gray-500">No one has filed a nomination for this election.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-8">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
         <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
           <ShieldAlert className="w-5 h-5 text-purple-600" />
           Candidate Management
         </h2>
         <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full">
           {candidates.length} Nominations
         </span>
      </div>

      <div className="divide-y divide-gray-100">
        {candidates.map((c) => (
          <div key={c.id} className="p-6 flex flex-col xl:flex-row gap-6 hover:bg-gray-50/50 transition-colors">
             <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                   {c.avatarUrl ? (
                      <Image src={c.avatarUrl} alt={c.name} width={48} height={48} className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                   ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                         {c.name ? c.name[0].toUpperCase() : 'U'}
                      </div>
                   )}
                   <div>
                      <h3 className="text-lg font-bold text-gray-900">{c.name}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                         {c.designation || 'Member'} &bull; {c.state || 'N/A'}, {c.district || 'N/A'}
                      </p>
                   </div>
                   <div className="ml-auto flex shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        c.status === 'approved' ? 'bg-green-100 text-green-700' :
                        c.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                         {c.status.replace('_', ' ').toUpperCase()}
                      </span>
                   </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                     <FileText className="w-3.5 h-3.5" /> Manifesto
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.manifesto}</p>
                </div>
                
                {c.posterUrl && (
                  <div className="mb-4">
                     <a href={c.posterUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium">
                       <ExternalLink className="w-4 h-4" /> View Campaign Poster (Banner)
                     </a>
                  </div>
                )}
             </div>

             <div className="xl:w-48 flex xl:flex-col gap-2 shrink-0 border-t xl:border-t-0 xl:border-l border-gray-100 pt-4 xl:pt-0 xl:pl-6 justify-center">
                 {c.status !== 'approved' && (
                    <button 
                      onClick={() => handleStatusChange(c.id, 'approved')}
                      disabled={isPending}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl font-medium transition-colors border border-green-200 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" /> Approve
                    </button>
                 )}
                 {c.status !== 'rejected' && (
                    <button 
                      onClick={() => handleStatusChange(c.id, 'rejected')}
                      disabled={isPending}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl font-medium transition-colors border border-orange-200 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                 )}
                 <button 
                   onClick={() => handleDelete(c.id)}
                   disabled={isPending}
                   className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-medium transition-colors border border-red-200 disabled:opacity-50 mt-auto"
                 >
                   <Trash2 className="w-4 h-4" /> Delete
                 </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
