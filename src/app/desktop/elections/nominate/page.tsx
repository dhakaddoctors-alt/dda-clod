import Navbar from '@/components/shared/Navbar';
import NominationForm from '@/components/ui/NominationForm';
import { fetchActiveElections } from '@/app/actions/electionActions';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';
import { Lock } from 'lucide-react';

export default async function NominationPage({ searchParams }: { searchParams: { electionId?: string } }) {
  const session = await getServerSession(authOptions) as any;

  // Must be logged in to file a nomination
  if (!session?.user?.id) {
    return (
       <div className="min-h-screen bg-gray-50 flex flex-col">
         <Navbar />
         <div className="flex flex-1 pt-16 items-center justify-center p-4">
           <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200 max-w-md w-full">
             <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
             <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
             <p className="text-gray-500 mb-6">You must be logged in as a verified member to file an election nomination.</p>
             <Link href="/login" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
               Login to Continue
             </Link>
           </div>
         </div>
       </div>
    );
  }

  const allElections = await fetchActiveElections();
  
  // Filter to only elections the user is eligible for based on their location
  const userState = session.user.state as string | null;
  const userDistrict = session.user.district as string | null;
  const eligibleElections = allElections.filter((e: any) => {
    if (e.level === 'national') return true;
    if (e.level === 'state') return userState && userState.toLowerCase() === (e.locationName || '').toLowerCase();
    if (e.level === 'district') return userDistrict && userDistrict.toLowerCase() === (e.locationName || '').toLowerCase();
    return false;
  });

  const defaultElection = searchParams.electionId
     ? eligibleElections.find((e: any) => e.id === searchParams.electionId)
     : eligibleElections[0];
  const currentElection = defaultElection || null;
  
  const now = new Date();
  const nomStart = currentElection?.nominationStartDate ? new Date(currentElection.nominationStartDate as any) : null;
  const nomEnd = currentElection?.nominationEndDate ? new Date(currentElection.nominationEndDate as any) : null;
  
  let phaseStatus = 'closed';
  if (!nomStart || !nomEnd) {
     phaseStatus = 'not_scheduled';
  } else if (now < nomStart) {
     phaseStatus = 'upcoming';
  } else if (now >= nomStart && now <= nomEnd) {
     phaseStatus = 'open';
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-16">
        <main className="flex-1 p-4 lg:p-8 w-full">
          <div className="max-w-3xl mx-auto">
            <Link href="/elections" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium mb-6 transition-colors text-sm">
               ← Back to Elections
            </Link>
            <NominationForm 
               election={currentElection as any}
               allElections={eligibleElections as any}
               phaseStatus={phaseStatus}
               nomStart={nomStart}
               nomEnd={nomEnd}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
