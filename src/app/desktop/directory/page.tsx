import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import { Search, Filter, MapPin, Briefcase, GraduationCap, Sparkles, Lock } from 'lucide-react';
import { fetchDirectoryMembers } from '@/app/actions/directoryActions';
import { generateSmartRecommendations } from '@/app/actions/aiActions';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export default async function DirectoryPage(props: { searchParams?: Promise<{ q?: string, filter?: string }> }) {
  const searchParams = await props.searchParams;
  const q = searchParams?.q || '';
  const filter = searchParams?.filter || 'all';

  // 1. Fetch DB records directly on the Server
  const members = await fetchDirectoryMembers(q, filter);
  
  // 2. Auth Session Check
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session;
  
  // Apply hard limit if guest
  const displayMembers = isAuthenticated ? members : members.slice(0, 6);

  const currentUserId = (session?.user as any)?.id || '';
  const isStudent = (session?.user as any)?.role === 'student';
  let aiMatches = null;

  if (isStudent && filter === 'doctor') {
    const aiData = await generateSmartRecommendations(currentUserId);
    aiMatches = aiData.matches;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex flex-1 pt-16">
        <main className="flex-1 p-4 lg:p-8 w-full">
          <div className="max-w-6xl mx-auto">
            {/* Header & Smart Search */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Member Directory</h1>
              
              {isAuthenticated ? (
                <>
                  <form method="GET" action="/directory" className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input 
                        type="text" 
                        name="q"
                        defaultValue={q}
                        placeholder="Smart Search: Try 'Delhi doctors' or 'Cardiologist'" 
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                      />
                      {filter !== 'all' && <input type="hidden" name="filter" value={filter} />}
                    </div>
                    
                    <button type="submit" className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors md:w-auto">
                      Search
                    </button>
                  </form>

                  <div className="flex gap-2 mt-4 overflow-x-auto pb-2 custom-scrollbar">
                    <Link href="/directory?filter=all" className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'all' || !filter ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                      All Members
                    </Link>
                    <Link href="/directory?filter=doctor" className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'doctor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                      Doctors Only
                    </Link>
                    <Link href="/directory?filter=student" className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'student' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                      Students
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <Link href="/register" className="relative flex-1 group cursor-pointer block">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-hover:text-blue-500 transition-colors" />
                      <input 
                        type="text" 
                        readOnly
                        placeholder="Smart Search: Try 'Delhi doctors' or 'Cardiologist'" 
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl cursor-pointer group-hover:border-blue-300 transition-colors pointer-events-none"
                      />
                    </Link>
                    
                    <Link href="/register" className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors md:w-auto">
                      Search
                    </Link>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center shrink-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-yellow-800">Login to Unlock Full Directory</h4>
                        <p className="text-sm text-yellow-700">Guests can only preview 6 members. Search and filters are disabled.</p>
                      </div>
                    </div>
                    <Link href="/login" className="px-5 py-2 whitespace-nowrap bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-bold rounded-lg transition-colors w-full sm:w-auto text-center">
                      Log In Now
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Smart AI Matchmaking Banner (Visible only for Students browsing Doctors) */}
            {aiMatches && aiMatches.length > 0 && (
               <div className="bg-gradient-to-r from-purple-700 to-indigo-800 rounded-2xl p-6 shadow-sm border border-purple-200 mb-8 relative overflow-hidden">
                 <Sparkles className="w-32 h-32 absolute -right-4 -top-8 opacity-10 text-white" />
                 <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 relative z-10">
                   <Sparkles className="w-5 h-5 text-yellow-300" /> 
                   AI Recommended Mentors for You
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                    {aiMatches.map((match: any) => (
                      <div key={match.id} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-white flex gap-4 items-start">
                         <div className="w-12 h-12 rounded-full bg-indigo-200 shrink-0 flex items-center justify-center font-bold text-indigo-700">
                           {match.doctorName.charAt(0)}
                         </div>
                         <div>
                           <h3 className="font-bold text-lg">{match.doctorName}</h3>
                           <p className="text-indigo-200 text-xs font-medium mb-2">{match.specialty} • {match.matchScore}% Match Score</p>
                           <p className="text-sm text-indigo-50 leading-relaxed italic border-l-2 border-purple-400 pl-2">{match.reason}</p>
                           <Link href={`/directory/${match.doctorId}`} className="mt-3 inline-block px-4 py-1.5 bg-white text-indigo-700 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-50 transition-colors">
                              Connect Mentor
                           </Link>
                         </div>
                      </div>
                    ))}
                 </div>
               </div>
            )}

            {/* Directory Grid */}
            {displayMembers.length === 0 ? (
               <div className="p-8 text-center bg-white rounded-2xl border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">No members found matching your criteria.</h3>
                  <p className="text-gray-500 mt-2">Try adjusting your search filters.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayMembers.map((member: any) => (
                  <div key={member.id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full bg-gray-100 mb-4 overflow-hidden border-4 border-white shadow-sm flex-shrink-0">
                      {member.avatarUrl ? (
                         <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400 bg-gray-100">
                           {member.name?.charAt(0) || 'U'}
                         </div>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{member.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold mt-2 capitalize ${
                      member.role === 'doctor' ? 'bg-green-100 text-green-700' :
                      member.role === 'student' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {member.role}
                    </span>

                    <div className="mt-4 w-full space-y-2 text-sm text-gray-600 flex-1 flex flex-col items-center">
                      {member.specialty && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="line-clamp-1">{member.specialty} • {member.experience} Yrs</span>
                        </div>
                      )}
                      {member.course && (
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="line-clamp-1">{member.course}</span>
                        </div>
                      )}
                      {member.clinicAddress && (
                         <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="line-clamp-1">{member.clinicAddress}</span>
                         </div>
                      )}
                    </div>

                    <Link href={`/directory/${member.id}`} className="mt-6 w-full py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg font-medium transition-colors">
                      View Profile
                    </Link>
                  </div>
                ))}
              </div>
            )}
            
            {!isAuthenticated && members.length > 6 && (
              <div className="mt-8 text-center">
                 <p className="text-gray-600 mb-4">You are viewing a limited preview. There are <strong>{members.length - 6}</strong> more members hidden.</p>
                 <Link href="/login" className="inline-flex items-center gap-2 px-8 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-sm transition-transform hover:scale-105">
                   <Lock className="w-5 h-5" /> Log In to View All
                 </Link>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
