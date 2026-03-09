import Navbar from '@/components/shared/Navbar';
import { Vote, AlertCircle, PlusCircle, ArrowLeft } from 'lucide-react';
import { fetchActiveElections, fetchCandidates } from '@/app/actions/electionActions';
import VoteButton from '@/components/ui/VoteButton';
import Link from 'next/link';

export default async function ElectionDetailPage({ params }: { params: { id: string } }) {
  const activeElections = await fetchActiveElections();
  const ongoingElection = activeElections.find(e => e.id === params.id) || null;
  const candidatesList = ongoingElection ? await fetchCandidates(ongoingElection.id) : [];

  if (!ongoingElection) {
     return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
           <Navbar />
           <div className="flex flex-1 pt-16 items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200 max-w-lg w-full">
                 <Vote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                 <h2 className="text-2xl font-bold text-gray-900 mb-2">Election Not Found</h2>
                 <p className="text-gray-500 mb-6">The election you are looking for does not exist or has been removed.</p>
                 <Link href="/elections" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
                    Return to Elections Hub
                 </Link>
              </div>
           </div>
        </div>
     );
  }

  const now = new Date();
  const voteStart = ongoingElection?.startDate ? new Date(ongoingElection.startDate) : null;
  const voteEnd = ongoingElection?.endDate ? new Date(ongoingElection.endDate) : null;
  
  let votingStatus = 'closed';
  if (!voteStart || !voteEnd) {
     votingStatus = 'not_scheduled';
  } else if (now < voteStart) {
     votingStatus = 'upcoming';
  } else if (now >= voteStart && now <= voteEnd) {
     votingStatus = 'active';
  } else if (now > voteEnd) {
     votingStatus = 'completed';
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex flex-1 pt-16">
        <main className="flex-1 p-4 lg:p-8 w-full">
          <div className="max-w-4xl mx-auto">
            
            <Link href="/elections" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium mb-6 transition-colors">
               <ArrowLeft className="w-4 h-4" /> Back to Elections
            </Link>

            <div className={`rounded-2xl p-8 text-white shadow-lg mb-8 relative overflow-hidden ${votingStatus === 'active' ? 'bg-gradient-to-r from-blue-700 to-indigo-800' : 'bg-gradient-to-r from-gray-700 to-gray-800'}`}>
              <Vote className="w-48 h-48 absolute -right-10 -bottom-10 opacity-10 text-white" />
              <div className="relative z-10">
                
                <div className="flex flex-wrap gap-2 mb-4">
                   {votingStatus === 'active' && (
                     <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block animate-pulse shadow-sm">
                       Live Voting Open
                     </span>
                   )}
                   {votingStatus === 'upcoming' && (
                     <span className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                       Voting Starts: {voteStart?.toLocaleString()}
                     </span>
                   )}
                   {votingStatus === 'not_scheduled' && (
                     <span className="bg-gray-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                       Dates Not Scheduled
                     </span>
                   )}
                   {votingStatus === 'completed' && (
                     <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                       Election Concluded
                     </span>
                   )}
                   
                   <span className="bg-white/20 backdrop-blur-sm border border-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block shadow-sm">
                     {ongoingElection.level === 'national' ? 'National Tier' : `${ongoingElection.locationName} Tier`}
                   </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold mb-2">{ongoingElection.title}</h1>
                <p className="text-blue-100 text-lg mb-6 max-w-2xl">{ongoingElection.description}</p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                   <Link href={`/elections/nominate?electionId=${ongoingElection.id}`} className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-gray-900 rounded-xl font-bold shadow-sm hover:bg-gray-100 transition-colors">
                     <PlusCircle className="w-5 h-5 text-gray-700" /> File Nomination Here
                   </Link>
                </div>
                
                <div className="bg-white/10 border border-white/20 p-4 rounded-xl flex items-start gap-3 backdrop-blur-sm">
                  <AlertCircle className="w-6 h-6 shrink-0 text-yellow-300" />
                  <p className="text-sm text-blue-50 leading-relaxed max-w-3xl">
                    <strong>1 Member = 1 Vote.</strong> Your vote is completely anonymous. The database only records that you have voted, not who you voted for, ensuring full electoral integrity.
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">Candidates for {ongoingElection.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {candidatesList.length === 0 ? (
                <div className="col-span-full bg-white p-8 rounded-2xl border border-gray-200 text-center shadow-sm">
                   <p className="text-gray-500 text-lg">No approved candidates available for this election yet.</p>
                </div>
              ) : (
                candidatesList.map((candidate: any) => (
                  <div key={candidate.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    {/* Poster Image */}
                    <div className="w-full h-64 bg-gray-100 relative overflow-hidden">
                      {candidate.posterUrl ? (
                        <img src={candidate.posterUrl} alt={`${candidate.name} Poster`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                          <Vote className="w-20 h-20 text-blue-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                      <div className="absolute top-4 right-4">
                          <span className="bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium border border-white/20 shadow-sm">
                            {candidate.designation || 'Candidate'}
                          </span>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full border-2 border-white overflow-hidden shadow-lg shrink-0 bg-white flex items-center justify-center">
                          {candidate.avatarUrl ? (
                            <img src={candidate.avatarUrl} alt={candidate.name} className="w-full h-full object-cover"/>
                          ) : (
                            <span className="text-2xl font-bold text-blue-600">{candidate.name?.charAt(0)}</span>
                          )}
                        </div>
                        <h3 className="text-2xl font-bold text-white shadow-sm">{candidate.name}</h3>
                      </div>
                    </div>
                    
                    {/* Manifesto */}
                    <div className="p-6 flex-1 flex flex-col relative pb-0">
                      <h4 className="font-semibold text-gray-900 mb-2">Key Manifesto Promises:</h4>
                      <p className="text-gray-600 text-sm flex-1 leading-relaxed">{candidate.manifesto}</p>
                      
                      {/* Interactive Voting Component (Only when ACTIVE) */}
                      {votingStatus === 'active' ? (
                         <VoteButton 
                            candidateId={candidate.id} 
                            electionId={ongoingElection.id}
                            candidateName={candidate.name}
                         />
                      ) : (
                         <button disabled className="w-full py-3 bg-gray-100 text-gray-500 font-bold rounded-xl outline-none mt-auto cursor-not-allowed">
                            {votingStatus === 'upcoming' || votingStatus === 'not_scheduled' ? 'Voting Not Open Yet' : 'Voting Closed'}
                         </button>
                      )}
                      <div className="h-6"></div> {/* Padding spacer */}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
