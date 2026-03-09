import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import { Layers, Users, Search } from 'lucide-react';
import { fetchCommitteesWithMembers } from '@/app/actions/committeeActions';
import Link from 'next/link';

export default async function CommitteesPage() {
  const committeeStructure = await fetchCommitteesWithMembers();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex flex-1 pt-16">
        <Sidebar />
        
        <main className="flex-1 lg:ml-64 p-4 lg:p-8 w-full">
          <div className="max-w-5xl mx-auto">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Layers className="w-6 h-6 text-blue-600" />
                  Committee Structure
                </h1>
                <p className="text-gray-600 mt-1">Hierarchical view of all DDA working committees</p>
              </div>
            </div>

            {committeeStructure.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-gray-700 mb-2">No Committees Yet</h2>
                <p className="text-gray-500 text-sm">An admin can add committees from the Admin Panel.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {committeeStructure.map((committee) => (
                  <div key={committee.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    {/* Committee Header */}
                    <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-gray-800">{committee.level}</h2>
                          {committee.locationName && (
                            <p className="text-sm text-gray-500">{committee.locationName}</p>
                          )}
                        </div>
                        <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full font-medium">
                          {committee.members.length} Members
                        </span>
                      </div>
                    </div>
                    
                    {/* Committee Members Grid */}
                    {committee.members.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-sm">No members assigned yet.</div>
                    ) : (
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {committee.members.map(member => (
                          <Link
                            key={member.id}
                            href={`/directory/${member.profileId}`}
                            className="border border-gray-100 rounded-lg p-3 flex items-start gap-3 hover:border-blue-300 hover:shadow-sm transition-all bg-white cursor-pointer group"
                          >
                            {member.avatarUrl ? (
                              <img src={member.avatarUrl} alt={member.name ?? ''} className="w-12 h-12 rounded-full object-cover border border-blue-100 shrink-0" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 shrink-0">
                                {(member.name ?? '?').charAt(0)}
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{member.name}</h3>
                              <p className="text-xs font-medium text-blue-600 mt-0.5">{member.designation}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
