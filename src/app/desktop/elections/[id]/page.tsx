import Navbar from '@/components/shared/Navbar';
import { Vote, AlertCircle, PlusCircle, ArrowLeft } from 'lucide-react';
import { fetchActiveElections, fetchCandidates } from '@/app/actions/electionActions';
import { fetchUserNominations } from '@/app/actions/nominationActions';
import VoteButton from '@/components/ui/VoteButton';
import WithdrawNominationButton from '@/components/ui/WithdrawNominationButton';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export default async function ElectionDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions) as any;
  const isEligibleRole = session?.user && (session.user.category === 'doctor' || session.user.category === 'student');

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

  const nomStart = ongoingElection?.nominationStartDate ? new Date(ongoingElection.nominationStartDate) : null;
  const nomEnd = ongoingElection?.nominationEndDate ? new Date(ongoingElection.nominationEndDate) : null;
  const isNominationOpen = nomStart && nomEnd && now >= nomStart && now <= nomEnd;

   const userNominations = session?.user ? await fetchUserNominations() : [];
   const existingNom = userNominations.find(n => n.electionId === params.id);

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
                 
                 <h1 className="text-2xl font-bold bg-white/10 w-fit px-4 py-1 rounded-full backdrop-blur-sm border border-white/20 mb-4 flex items-center gap-2">
                    {votingStatus === 'active' ? (
                       <><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> Live Now</>
                    ) : (
                       <span className="capitalize">{votingStatus.replace('_', ' ')}</span>
                    )}
                 </h1>

                 {/* Rest of header content moved down for brevity in matching, but I'll replace the relevant section below */}
                 
                 <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-white/20 backdrop-blur-sm border border-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block shadow-sm">
                      {ongoingElection.level === 'national' ? 'National Tier' : `${ongoingElection.locationName} Tier`}
                    </span>
                 </div>
 
                 <h1 className="text-3xl md:text-4xl font-bold mb-2">{ongoingElection.title}</h1>
                 <p className="text-blue-100 text-lg mb-6 max-w-2xl">{ongoingElection.description}</p>
                 
                 <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-6">
                    {isEligibleRole && isNominationOpen && (
                       <Link href={`/elections/nominate?electionId=${ongoingElection.id}`} className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-gray-900 rounded-xl font-bold shadow-sm hover:bg-gray-100 transition-colors">
                         <PlusCircle className="w-5 h-5 text-gray-700" /> {existingNom ? 'Manage Nomination' : 'Enroll / Nominate Now'}
                       </Link>
                    )}
                    {existingNom && isNominationOpen && (
                       <WithdrawNominationButton candidateId={existingNom.id} />
                    )}
                    {isEligibleRole && !isNominationOpen && nomEnd && now > nomEnd && (
                       <span className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white/20 text-white rounded-xl font-bold">
                         Nominations Closed
                       </span>
                    )}
                 </div>
                
                <div className="bg-white/10 border border-white/20 p-4 rounded-xl flex items-start gap-3 backdrop-blur-sm">
                  <AlertCircle className="w-6 h-6 shrink-0 text-yellow-300" />
                  <p className="text-sm text-blue-50 leading-relaxed max-w-3xl">
                    <strong>1 Person = 1 Vote Per Post.</strong> Your vote is completely anonymous. The database only records that you have voted, not who you voted for, ensuring full electoral integrity.
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6 font-primary">Active Contested Nominations</h2>
            
            {candidatesList.length === 0 ? (
               <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center shadow-sm">
                  <Vote className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No approved candidates available for this election yet.</p>
               </div>
            ) : (
               Object.entries(
                  candidatesList.reduce((acc: any, c: any) => {
                     const postName = c.positionName || 'General';
                     if (!acc[postName]) acc[postName] = [];
                     acc[postName].push(c);
                     return acc;
                  }, {})
               ).map(([postName, candidates]: [string, any]) => (
                  <div key={postName} className="mb-12 last:mb-0">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="h-px flex-1 bg-gray-200"></div>
                        <h3 className="bg-blue-50 text-blue-800 px-4 py-1.5 rounded-full text-sm font-bold border border-blue-100 uppercase tracking-widest shadow-sm">
                           Post: {postName}
                        </h3>
                        <div className="h-px flex-1 bg-gray-200"></div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {candidates.map((candidate: any) => (
                           <div key={candidate.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:border-blue-200 hover:shadow-md transition-all group">
                              {/* Poster Image */}
                              <div className="w-full h-64 bg-gray-100 relative overflow-hidden">
                                 {candidate.posterUrl ? (
                                    <img src={candidate.posterUrl} alt={`${candidate.name} Poster`} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                                 ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                                       <Vote className="w-20 h-20 text-blue-300" />
                                    </div>
                                 )}
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                 <div className="absolute top-4 right-4">
                                    <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-bold border border-white/20 shadow-sm uppercase tracking-wider">
                                       {candidate.designation || 'Candidate'}
                                    </span>
                                 </div>
                                 <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-lg shrink-0 bg-white flex items-center justify-center">
                                       {candidate.avatarUrl ? (
                                          <img src={candidate.avatarUrl} alt={candidate.name} className="w-full h-full object-cover object-top"/>
                                       ) : (
                                          <span className="text-xl font-bold text-blue-600">{candidate.name?.charAt(0)}</span>
                                       )}
                                    </div>
                                    <h3 className="text-xl font-bold text-white shadow-sm line-clamp-1">{candidate.name}</h3>
                                 </div>
                              </div>
                              
                              {/* Manifesto */}
                              <div className="p-5 flex-1 flex flex-col relative bg-white">
                                 <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mandate & Vision:</h4>
                                 <p className="text-gray-600 text-sm flex-1 leading-relaxed line-clamp-4">{candidate.manifesto}</p>
                                 
                                 {/* Interactive Voting Component (Only when ACTIVE) */}
                                 {votingStatus === 'active' ? (
                                    <VoteButton 
                                       candidateId={candidate.id} 
                                       electionId={ongoingElection.id}
                                       candidateName={candidate.name}
                                       postId={candidate.postId}
                                    />
                                 ) : (
                                    <button disabled className="w-full py-3 bg-gray-100 text-gray-400 font-bold rounded-xl outline-none mt-6 cursor-not-allowed text-sm">
                                       {votingStatus === 'upcoming' || votingStatus === 'not_scheduled' ? 'Voting Not Open Yet' : 'Voting Closed'}
                                    </button>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               ))
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
