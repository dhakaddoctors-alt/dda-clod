import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import { Users, FileCheck, Database, Server, Activity, ShieldAlert } from 'lucide-react';
import { fetchPendingApprovals, fetchDeletedUsers } from '@/app/actions/adminActions';
import { fetchLiveElectionAnalytics } from '@/app/actions/nominationActions';
import ApproveRejectButtons from '@/components/ui/ApproveRejectButtons';
import CommitteeBuilder from '@/components/ui/CommitteeBuilder';
import AiAdminPanel from '@/components/ui/AiAdminPanel';
import ElectionAnalyticsPanel from '@/components/ui/ElectionAnalyticsPanel';
import ExportMembersButton from '@/components/ui/ExportMembersButton';

export default async function AdminDashboardPage() {
  const stats = [
    { title: 'Total Members', value: '4,209', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Pending Approvals', value: '142', icon: FileCheck, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { title: 'Database Reads', value: '1.2M / 5M', icon: Database, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'Storage Used', value: '450MB / 10GB', icon: Server, color: 'text-green-600', bg: 'bg-green-100' },
  ];

  const pendingUsers = await fetchPendingApprovals();
  const deletedUsers = await fetchDeletedUsers();
  const electionAnalytics = await fetchLiveElectionAnalytics('election_1');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex flex-1 pt-16">
        <Sidebar />
        
        <main className="flex-1 lg:ml-64 p-4 lg:p-8 w-full">
          <div className="max-w-6xl mx-auto">
            
            {/* Header */}
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600 mt-1">Manage portal users, verify payments, and monitor Cloudflare metrics.</p>
              </div>
              <ExportMembersButton />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Election Analytics */}
            {electionAnalytics && (
               <ElectionAnalyticsPanel data={electionAnalytics} />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Main Content Area - Approvals */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">Pending Approvals</h2>
                    <button className="text-sm text-blue-600 font-medium hover:text-blue-700">View All</button>
                  </div>
                  <div className="divide-y divide-gray-100 flex-1">
                    {pendingUsers.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                         No pending approvals.
                      </div>
                    ) : (
                      pendingUsers.map((user: any) => (
                        <div key={user.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 flex-shrink-0">
                              {user.fullName.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 line-clamp-1">{user.fullName}</h3>
                              <p className="text-sm text-gray-500 capitalize">{user.role} • Submitted {user.submitted || 'recently'}</p>
                              {user.paymentReceiptUrl && (
                                <a href={user.paymentReceiptUrl} target="_blank" className="text-xs text-blue-600 font-medium mt-1 inline-block hover:underline truncate max-w-[200px]" rel="noreferrer">
                                  View Payment Receipt
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                            <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full w-full sm:w-auto text-center capitalize">
                              {user.paymentStatus}
                            </span>
                            <ApproveRejectButtons profileId={user.id} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                </div>

                {/* Soft Deleted Users Section */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-6">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-red-50">
                    <h2 className="text-lg font-bold text-red-900">Soft-Deleted Members</h2>
                  </div>
                  <div className="divide-y divide-gray-100 flex-1">
                    {deletedUsers.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                         No deleted members at this time.
                      </div>
                    ) : (
                      deletedUsers.map((user: any) => (
                        <div key={user.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center font-bold text-red-700 flex-shrink-0">
                                {user.fullName.charAt(0)}
                             </div>
                             <div>
                                <h3 className="font-semibold text-gray-900 line-clamp-1">{user.fullName} <span className="text-xs ml-2 text-red-600 bg-red-100 px-2 rounded-full py-0.5 uppercase font-bold tracking-wide">Removed</span></h3>
                                <p className="text-sm text-gray-500">{user.email}</p>
                             </div>
                          </div>
                          <div>
                            <Link href={`/directory/${user.id}`} className="text-sm font-medium bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition">
                              View Profile to Restore
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Committee Hierarchy Builder Section */}
              <div className="lg:col-span-2 space-y-6">
                 <CommitteeBuilder />
              </div>

              {/* Sidebar Content Area - System Health & AI */}
              <div className="space-y-6">
                 
                {/* Embedded AI Control Panel */}
                <AiAdminPanel />

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    System Status
                  </h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Frontend (Vercel)</span>
                      <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">Operational</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Database (D1)</span>
                      <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">24ms Latency</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Storage (R2)</span>
                      <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">Operational</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <ShieldAlert className="w-4 h-4" /> AI Moderation
                      </span>
                      <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-sm p-6 text-white relative overflow-hidden">
                  <Database className="w-32 h-32 absolute -right-6 -bottom-6 opacity-10" />
                  <h3 className="font-bold text-lg mb-2 relative z-10">Database Backup</h3>
                  <p className="text-blue-100 text-sm mb-4 relative z-10">Last auto-backup: 2 hours ago. You can trigger a manual D1 snapshot here.</p>
                  <button className="w-full py-2 bg-white text-blue-700 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors relative z-10">
                    Trigger Manual Backup
                  </button>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
