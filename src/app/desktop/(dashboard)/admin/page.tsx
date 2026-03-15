import Navbar from '@/components/shared/Navbar';
export const dynamic = 'force-dynamic';
import { Users, FileCheck, Database, Server, Activity, ShieldAlert } from 'lucide-react';
import { fetchAllUsersForAdmin } from '@/app/actions/adminActions';
import { fetchCommitteesWithMembers } from '@/app/actions/committeeActions';
import { fetchLiveElectionAnalytics } from '@/app/actions/nominationActions';
import { fetchAllNews } from '@/app/actions/newsActions';
import AdminMemberManager from '@/components/ui/AdminMemberManager';
import CommitteeBuilder from '@/components/ui/CommitteeBuilder';
import NewsManager from '@/components/ui/NewsManager';
import AiAdminPanel from '@/components/ui/AiAdminPanel';
import AdminElectionManager from '@/components/ui/AdminElectionManager';
import ExportMembersButton from '@/components/ui/ExportMembersButton';
import ExportMembersPDFButton from '@/components/ui/ExportMembersPDFButton';
import DatabaseBackupButton from '@/components/ui/DatabaseBackupButton';
import { fetchActiveElections } from '@/app/actions/electionActions';
import { adminFetchAllPosts } from '@/app/actions/postActions';
import { adminFetchAllStories } from '@/app/actions/storyActions';
import Link from 'next/link';
import AdminFeedManager from '@/components/ui/AdminFeedManager';
import AdminStoryManager from '@/components/ui/AdminStoryManager';
import { fetchAdsForAdmin } from '@/app/actions/adActions';
import AdminAdManager from '@/components/ui/AdminAdManager';

export default async function AdminDashboardPage() {
  const allUsers = await fetchAllUsersForAdmin();
  const pendingCount = allUsers.filter(u => u.paymentStatus === 'pending' && u.isDeleted === 0).length;

  const doctorsCount = allUsers.filter(u => u.role === 'doctor' && u.isDeleted === 0).length;
  const newsList = await fetchAllNews();
  const newsCount = newsList.length;

  const adsList = await fetchAdsForAdmin();
  const pendingAdsCount = adsList.filter(a => a.status === 'pending').length;

  const stats = [
    { title: 'Total Members', value: allUsers.length.toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Pending Approvals', value: pendingCount.toString(), icon: FileCheck, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { title: 'Registered Doctors', value: doctorsCount.toString(), icon: Database, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'News & Updates', value: newsCount.toString(), icon: Server, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Ad Requests', value: pendingAdsCount.toString(), icon: FileCheck, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  const activeElections = await fetchActiveElections();
  const allPosts = await adminFetchAllPosts();
  const allStories = await adminFetchAllStories();
  const committeeData = await fetchCommitteesWithMembers();

  // Pre-fetch all analytics for existing elections so the client switches are instant
  const analyticsData: Record<string, any> = {};
  await Promise.all(
     activeElections.map(async (e) => {
        analyticsData[e.id] = await fetchLiveElectionAnalytics(e.id);
     })
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex flex-1 pt-16">
        <main className="flex-1 p-4 lg:p-8 w-full">
          <div className="max-w-6xl mx-auto">
            
            {/* Header */}
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600 mt-1">Manage portal users, verify payments, and monitor Cloudflare metrics.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 mt-4 sm:mt-0">
                <ExportMembersPDFButton />
                <ExportMembersButton />
              </div>
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

            {/* Master Member Manager - TOP */}
            <AdminMemberManager initialUsers={allUsers} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Main Left Content Area */}
              <div className="lg:col-span-2 space-y-6 min-w-0">

                {/* News Slider Management */}
                <NewsManager initialNews={newsList} />

                {/* Committee Hierarchy Builder Section */}
                <CommitteeBuilder initialTiers={committeeData} />

                {/* Advertisement Management Section */}
                <AdminAdManager initialAds={adsList as any} />

                {/* Content Moderation Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  {/* Social Feed Manager */}
                  <AdminFeedManager initialPosts={allPosts as any} />
                  
                  {/* Story Manager */}
                  <AdminStoryManager initialStories={allStories as any} />
                </div>

                {/* Election Control Center - BOTTOM */}
                <AdminElectionManager 
                   elections={activeElections} 
                   analyticsData={analyticsData} 
                />
              </div>

              {/* Sidebar Content Area - System Health & AI */}
              <div className="space-y-6 w-full min-w-0">
                 
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
                  <p className="text-blue-100 text-sm mb-4 relative z-10">Download a full JSON snapshot of your current members, students, and doctors records.</p>
                  <DatabaseBackupButton />
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
