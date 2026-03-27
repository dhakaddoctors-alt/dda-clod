'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, BarChart2, CheckCircle, Save, Trash2, Edit2, Loader2, X } from 'lucide-react';
import ElectionAnalyticsPanel from '@/components/ui/ElectionAnalyticsPanel';
import ElectionConfigPanel from '@/components/ui/ElectionConfigPanel';
import { adminDeleteElection, adminUpdateElectionDetails } from '@/app/actions/electionActions';
import { toast } from 'react-hot-toast';
import CreateElectionModal from '@/components/ui/CreateElectionModal';
import AdminCandidateManager from '@/components/ui/AdminCandidateManager';

export default function AdminElectionManager({ 
  elections,
  analyticsData,
  allCandidates
}: { 
  elections: any[],
  analyticsData: any, // Dict mapping electionId to its AnalyticsData
  allCandidates: Record<string, any[]>
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedElectionId, setSelectedElectionId] = useState<string | null>(elections[0]?.id || null);
  const [detailTab, setDetailTab] = useState<'overview' | 'candidates'>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const selectedElection = elections.find(e => e.id === selectedElectionId) || null;
  const selectedAnalytics = selectedElectionId ? analyticsData[selectedElectionId] : null;
  const selectedCandidates = selectedElectionId ? allCandidates[selectedElectionId] : [];

  const handleDelete = async () => {
    if (!selectedElectionId) return;
    if (window.confirm('Are you absolutely sure you want to delete this election? ALL candidate data and voting records will be permanently erased. This cannot be undone.')) {
       setIsDeleting(true);
       try {
         const res = await adminDeleteElection(selectedElectionId);
         if (res.success) {
           toast.success(res.message);
           
           startTransition(() => {
              setSelectedElectionId(elections.find(e => e.id !== selectedElectionId)?.id || null);
              router.refresh();
           });
         } else {
           toast.error(res.message);
         }
       } catch (error) {
         toast.error('Deletion failed');
       } finally {
         setIsDeleting(false);
       }
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedElectionId) return;
    setIsDeleting(true); // Re-use generic loading state
    
    try {
      const formData = new FormData(e.currentTarget);
      const res = await adminUpdateElectionDetails(selectedElectionId, {
         title: formData.get('title') as string,
         description: formData.get('description') as string,
         level: formData.get('level') as string,
         locationName: formData.get('locationName') as string || null
      });
      
      if (res.success) {
        toast.success(res.message);
        setIsEditModalOpen(false);
        startTransition(() => {
           router.refresh();
        });
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error('Failed to edit election.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mb-10 border border-gray-200 bg-white shadow-sm rounded-2xl overflow-hidden">
        {/* Header section */}
        <div className="bg-gray-50 border-b border-gray-200 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
               <h2 className="text-xl font-bold text-gray-900">Election Management</h2>
               <p className="text-sm text-gray-500 mt-1">Manage multiple voting events across National, State, and District levels.</p>
            </div>
            <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
            >
                <PlusCircle className="w-5 h-5" />
                Create Election
            </button>
        </div>

        <div className="flex flex-col md:flex-row">
            {/* Sidebar list of elections */}
            <div className="w-full md:w-80 border-r border-gray-200 bg-gray-50/50 flex shrink-0 flex-col h-[600px] overflow-y-auto">
               {elections.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">No elections found.</div>
               ) : (
                  <div className="p-3 space-y-2">
                     {elections.map((election) => (
                        <button
                           key={election.id}
                           onClick={() => setSelectedElectionId(election.id)}
                           className={`w-full text-left p-4 rounded-xl border transition-all ${
                              selectedElectionId === election.id 
                                ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-500' 
                                : 'bg-transparent border-transparent hover:bg-gray-100 hover:border-gray-200'
                           }`}
                        >
                           <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-gray-900 line-clamp-1 pr-2">{election.title}</span>
                              {election.status === 'active' && <span className="flex w-2.5 h-2.5 bg-red-500 rounded-full shrink-0 mt-1.5 animate-pulse"></span>}
                           </div>
                           <div className="flex flex-wrap gap-2 text-xs font-semibold mt-2">
                              {election.level === 'national' ? (
                                 <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">National</span>
                              ) : (
                                 <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded">{election.locationName}</span>
                              )}
                              <span className={`px-2 py-0.5 rounded ${
                                 election.status === 'active' ? 'bg-green-100 text-green-700' : 
                                 election.status === 'upcoming' ? 'bg-blue-100 text-blue-700' : 
                                 'bg-gray-100 text-gray-700'
                              }`}>
                                 {election.status.charAt(0).toUpperCase() + election.status.slice(1)}
                              </span>
                              {allCandidates[election.id] && allCandidates[election.id].some((c: any) => c.status === 'pending_approval') && (
                                 <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                                    Pending Review
                                 </span>
                              )}
                           </div>
                        </button>
                     ))}
                  </div>
               )}
            </div>

            {/* Main Detail View */}
            <div className="flex-1 bg-white p-6 h-[600px] overflow-y-auto">
               {selectedElection ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                         <div className="flex-1 pr-4">
                            <div className="flex items-center gap-3 mb-1">
                               <h3 className="text-2xl font-bold text-gray-900">{selectedElection.title}</h3>
                               <div className="flex gap-2">
                                 <button onClick={() => setIsEditModalOpen(true)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Election Details">
                                   <Edit2 className="w-4 h-4" />
                                 </button>
                                 <button onClick={handleDelete} disabled={isDeleting} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Delete Entire Election">
                                   {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                 </button>
                               </div>
                             </div>
                            <p className="text-gray-600 text-sm whitespace-pre-wrap">{selectedElection.description}</p>
                         </div>
                         <div className="flex flex-col gap-2 shrink-0">
                           <button 
                              onClick={() => setDetailTab('overview')}
                              className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${detailTab === 'overview' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                           >
                              Overview
                           </button>
                           <button 
                              onClick={() => setDetailTab('candidates')}
                              className={`px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-1.5 ${detailTab === 'candidates' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                           >
                              Candidates
                              {selectedCandidates?.some((c: any) => c.status === 'pending_approval') && (
                                 <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                              )}
                           </button>
                        </div>
                     </div>

                     {detailTab === 'overview' ? (
                        <>
                           {/* Step 2: Manage Positions */}
                           <div className="p-5 border border-blue-100 bg-blue-50/30 rounded-2xl">
                              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                 <CheckCircle className="w-5 h-5 text-blue-600" />
                                 Step 2: Manage Contested Positions
                              </h4>
                              <PositionManager election={selectedElection} />
                           </div>

                           <div className="h-px bg-gray-100 my-6"></div>

                           {/* Analytics (if any exist) */}
                           {selectedAnalytics && selectedAnalytics.totalVotesCast > 0 && (
                              <ElectionAnalyticsPanel data={selectedAnalytics} />
                           )}

                           {/* Configuration Form */}
                           <ElectionConfigPanel election={selectedElection} />
                        </>
                     ) : (
                        <AdminCandidateManager 
                           electionId={selectedElection.id} 
                           candidates={selectedCandidates || []} 
                        />
                     )}
                  </div>
               ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                     <BarChart2 className="w-16 h-16 mb-4 opacity-20" />
                     <p>Select an election from the specific tier to view details</p>
                  </div>
               )}
            </div>
        </div>

        <CreateElectionModal 
           isOpen={isCreateModalOpen} 
           onClose={() => setIsCreateModalOpen(false)} 
        />

        {/* Edit Election Modal inline directly integrated */}
        {isEditModalOpen && selectedElection && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-blue-600" />
                  Edit Election Details
                </h2>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
      
              <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-1">Election Title <span className="text-red-500">*</span></label>
                   <input type="text" name="title" defaultValue={selectedElection.title} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
      
                <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-1">Description (Optional)</label>
                   <textarea name="description" defaultValue={selectedElection.description || ''} rows={3} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
      


                <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-1">Organizational Level</label>
                   <select 
                     name="level" 
                     defaultValue={selectedElection.level}
                     className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                   >
                     <option value="national">National (Central Committee)</option>
                     <option value="state">State Level</option>
                     <option value="district">District Level</option>
                   </select>
                </div>
      
                <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-1">Location Name</label>
                   <input type="text" name="locationName" defaultValue={selectedElection.locationName || ''} placeholder="e.g. Madhya Pradesh (Optional for National)" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
      
                <div className="pt-4 flex justify-end gap-3">
                   <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                     Cancel
                   </button>
                   <button type="submit" disabled={isDeleting} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center gap-2">
                     {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                     {isDeleting ? 'Updating...' : 'Save Changes'}
                   </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}

function PositionManager({ election }: { election: any }) {
  const [newPos, setNewPos] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAdd = async () => {
    if (!newPos.trim()) return;
    setIsAdding(true);
    try {
      const res = await (await import('@/app/actions/electionActions')).addPositionToElection(election.id, newPos);
      if (res.success) {
        toast.success(res.message);
        setNewPos('');
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(res.message);
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeletePos = async (postId: string) => {
    if (!window.confirm('Delete this position?')) return;
    try {
      const res = await (await import('@/app/actions/electionActions')).deletePosition(postId);
      if (res.success) {
        toast.success(res.message);
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (e) {
      toast.error('Failed to delete position.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input 
          type="text" 
          value={newPos}
          onChange={(e) => setNewPos(e.target.value)}
          placeholder="New Post Name (e.g. Treasurer)"
          className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <button 
          onClick={handleAdd}
          disabled={isAdding || !newPos.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
          Add Post
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(!election.positions || election.positions.length === 0) ? (
          <p className="col-span-2 text-sm text-gray-500 italic p-4 text-center border-2 border-dashed border-gray-100 rounded-xl">No positions added yet. Please add at least one position for this election.</p>
        ) : (
          election.positions.map((pos: any) => (
            <div key={pos.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-blue-200 transition-all">
              <span className="font-semibold text-gray-800 text-sm">{pos.name}</span>
              <button 
                onClick={() => handleDeletePos(pos.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Position"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
