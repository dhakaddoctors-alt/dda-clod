import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import { Vote, CheckCircle2, AlertCircle, PlusCircle } from 'lucide-react';
import { fetchActiveElections, fetchCandidates } from '@/app/actions/electionActions';
import VoteButton from '@/components/ui/VoteButton';
import Link from 'next/link';

export default async function ElectionsPage() {
  const activeElections = await fetchActiveElections();
  const ongoingElection = activeElections[0] || null;
  const candidatesList = ongoingElection ? await fetchCandidates(ongoingElection.id) : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex flex-1 pt-16">
        <Sidebar />
        
        <main className="flex-1 lg:ml-64 p-4 lg:p-8 w-full">
          <div className="max-w-4xl mx-auto">
            
            {ongoingElection ? (
              <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-8 text-white shadow-lg mb-8 relative overflow-hidden">
                <Vote className="w-48 h-48 absolute -right-10 -bottom-10 opacity-10 text-white" />
                <div className="relative z-10">
                  <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block animate-pulse">
                    Live Voting Open
                  </span>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">{ongoingElection.title}</h1>
                  <p className="text-blue-100 text-lg mb-6">{ongoingElection.description}</p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                     <Link href="/elections/nominate" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-blue-800 rounded-xl font-bold shadow-sm hover:bg-gray-100 transition-colors">
                       <PlusCircle className="w-5 h-5" /> File Nomination
                     </Link>
                  </div>
                  
                  <div className="bg-white/10 border border-white/20 p-4 rounded-xl flex items-start gap-3 backdrop-blur-sm">
                    <AlertCircle className="w-6 h-6 shrink-0 text-yellow-300" />
                    <p className="text-sm text-blue-50 leading-relaxed">
                      <strong>1 Member = 1 Vote.</strong> Your vote is completely anonymous. The database only records that you have voted, not who you voted for, ensuring full electoral integrity.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
               <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200 mb-8">
                 <Vote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                 <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Elections</h2>
                 <p className="text-gray-500">There are currently no live elections. You will be notified when nominations or voting begins.</p>
               </div>
            )}

            {ongoingElection && (
               <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Candidates for President</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {candidatesList.length === 0 ? (
                      <p className="text-gray-500">No approved candidates available yet.</p>
                    ) : (
                      candidatesList.map((candidate: any) => (
                        <div key={candidate.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                          {/* Poster Image */}
                          <div className="w-full h-64 bg-gray-100 relative">
                            <img src={candidate.posterUrl} alt={`${candidate.name} Poster`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                            <div className="absolute top-4 right-4">
                                <span className="bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium border border-white/20 shadow-sm">
                                  {candidate.designation}
                                </span>
                            </div>
                            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-4">
                              <div className="w-16 h-16 rounded-full border-2 border-white overflow-hidden shadow-lg shrink-0 bg-white">
                                <img src={candidate.avatarUrl} alt={candidate.name} className="w-full h-full object-cover"/>
                              </div>
                              <h3 className="text-2xl font-bold text-white shadow-sm">{candidate.name}</h3>
                            </div>
                          </div>
                          
                          {/* Manifesto */}
                          <div className="p-6 flex-1 flex flex-col relative pb-0">
                            <h4 className="font-semibold text-gray-900 mb-2">Key Manifesto Promises:</h4>
                            <p className="text-gray-600 text-sm flex-1 leading-relaxed">{candidate.manifesto}</p>
                            
                            {/* Interactive Voting Component */}
                            <VoteButton 
                               candidateId={candidate.id} 
                               electionId={ongoingElection.id}
                               candidateName={candidate.name}
                            />
                            <div className="h-6"></div> {/* Padding spacer */}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
               </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
