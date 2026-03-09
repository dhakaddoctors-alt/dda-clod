import Navbar from '@/components/shared/Navbar';
import { Vote, CalendarClock, ChevronRight, TrendingUp, AlertCircle, MapPin } from 'lucide-react';
import { fetchActiveElections } from '@/app/actions/electionActions';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';

function isEligible(election: any, userState?: string | null, userDistrict?: string | null): boolean {
  if (election.level === 'national') return true;
  if (election.level === 'state') {
    return !!(userState && userState.toLowerCase() === (election.locationName || '').toLowerCase());
  }
  if (election.level === 'district') {
    return !!(userDistrict && userDistrict.toLowerCase() === (election.locationName || '').toLowerCase());
  }
  return false;
}

export default async function ElectionsHubPage() {
  const allElections = await fetchActiveElections();
  const session = await getServerSession(authOptions) as any;
  const userState = session?.user?.state as string | null | undefined;
  const userDistrict = session?.user?.district as string | null | undefined;

  // Filter to only elections the logged-in user is eligible for
  const eligibleElections = allElections.filter(e => isEligible(e, userState, userDistrict));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex flex-1 pt-16">
        <main className="flex-1 p-4 lg:p-8 w-full">
          <div className="max-w-6xl mx-auto">
            
            <div className="mb-8 border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
               <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                     <Vote className="w-8 h-8 text-blue-600" />
                     Elections Hub
                  </h1>
                  <p className="text-gray-600 mt-2">Your eligible elections based on your registered address.</p>
               </div>
               
               {(userState || userDistrict) && (
                  <div className="bg-blue-50 text-blue-800 text-sm font-semibold px-4 py-2 rounded-xl border border-blue-100 flex items-center gap-2">
                     <MapPin className="w-4 h-4" />
                     {userDistrict ? `${userDistrict}, ` : ''}{userState || 'India'}
                  </div>
               )}
            </div>

            {eligibleElections.length === 0 ? (
               <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200 mb-8">
                 <CalendarClock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                 <h2 className="text-2xl font-bold text-gray-900 mb-2">No Elections Available</h2>
                 <p className="text-gray-500 max-w-md mx-auto">
                    There are currently no scheduled elections for your region or nationally. You will be notified when nominations or voting begins.
                 </p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {eligibleElections.map((election) => {
                     const now = new Date();
                     const voteStart = election.startDate ? new Date(election.startDate) : null;
                     const voteEnd = election.endDate ? new Date(election.endDate) : null;
                     
                     let statusTag = null;
                     let isActive = false;

                     if (!voteStart || !voteEnd) {
                        statusTag = <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-md">Dates Pending</span>;
                     } else if (now < voteStart) {
                        statusTag = <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2.5 py-1 rounded-md">Upcoming</span>;
                     } else if (now >= voteStart && now <= voteEnd) {
                        isActive = true;
                        statusTag = <span className="bg-red-100 text-red-600 border border-red-200 text-xs font-bold px-2.5 py-1 rounded-md animate-pulse">Live Voting</span>;
                     } else {
                        statusTag = <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-md">Completed</span>;
                     }

                     return (
                        <Link 
                           href={`/elections/${election.id}`} 
                           key={election.id}
                           className="group block bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                        >
                           <div className={`h-2 w-full ${isActive ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                           <div className="p-6 flex-1 flex flex-col">
                              <div className="flex justify-between items-start mb-4">
                                 <div className="flex flex-wrap gap-2">
                                    {statusTag}
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${election.level === 'national' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
                                       {election.level === 'national' ? 'National' : election.locationName}
                                    </span>
                                 </div>
                              </div>
                              
                              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                 {election.title}
                              </h3>
                              <p className="text-sm text-gray-600 line-clamp-2 mb-6 flex-1">
                                 {election.description}
                              </p>

                              <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-sm font-medium">
                                 <div className="flex items-center gap-1.5 text-gray-500">
                                    <TrendingUp className="w-4 h-4" /> View Candidates
                                 </div>
                                 <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                              </div>
                           </div>
                        </Link>
                     );
                  })}
               </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
