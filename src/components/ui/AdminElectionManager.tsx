'use client';

import { useState } from 'react';
import { PlusCircle, BarChart2, Edit, CheckCircle } from 'lucide-react';
import ElectionAnalyticsPanel from '@/components/ui/ElectionAnalyticsPanel';
import ElectionConfigPanel from '@/components/ui/ElectionConfigPanel';
import CreateElectionModal from '@/components/ui/CreateElectionModal';

export default function AdminElectionManager({ 
  elections,
  analyticsData
}: { 
  elections: any[],
  analyticsData: any // Dict mapping electionId to its AnalyticsData
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedElectionId, setSelectedElectionId] = useState<string | null>(elections[0]?.id || null);

  const selectedElection = elections.find(e => e.id === selectedElectionId) || null;
  const selectedAnalytics = selectedElectionId ? analyticsData[selectedElectionId] : null;

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
            <div className="w-full md:w-80 border-r border-gray-200 bg-gray-50/50 flex shrink-0 flex-col h-[500px] overflow-y-auto">
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
                           </div>
                        </button>
                     ))}
                  </div>
               )}
            </div>

            {/* Main Detail View */}
            <div className="flex-1 bg-white p-6 h-[500px] overflow-y-auto">
               {selectedElection ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                     <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedElection.title}</h3>
                        <p className="text-gray-600">{selectedElection.description}</p>
                     </div>

                     {/* Analytics (if any exist) */}
                     {selectedAnalytics && selectedAnalytics.totalVotesCast > 0 && (
                        <ElectionAnalyticsPanel data={selectedAnalytics} />
                     )}

                     {/* Configuration Form */}
                     <ElectionConfigPanel election={selectedElection} />
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
    </div>
  );
}
