'use client';

import { useState } from 'react';
import { 
  Users, 
  Newspaper, 
  UsersRound, 
  Megaphone, 
  Settings2, 
  MessageSquare, 
  History, 
  Vote 
} from 'lucide-react';
import AdminMemberManager from './AdminMemberManager';
import NewsManager from './NewsManager';
import CommitteeBuilder from './CommitteeBuilder';
import AdminAdManager from './AdminAdManager';
import AdminRegistrationManager from './AdminRegistrationManager';
import AdminFeedManager from './AdminFeedManager';
import AdminStoryManager from './AdminStoryManager';
import AdminElectionManager from './AdminElectionManager';

interface AdminDashboardTabsProps {
  allUsers: any[];
  viewerRole: string;
  newsList: any[];
  committeeData: any[];
  adsList: any[];
  activeElections: any[];
  analyticsData: Record<string, any>;
  allCandidates: Record<string, any[]>;
  allPosts: any[];
  allStories: any[];
}

export default function AdminDashboardTabs({
  allUsers,
  viewerRole,
  newsList,
  committeeData,
  adsList,
  activeElections,
  analyticsData,
  allCandidates,
  allPosts,
  allStories
}: AdminDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState('members');

  const tabs = [
    { id: 'members', label: 'Members', icon: Users },
    { id: 'news', label: 'News', icon: Newspaper },
    { id: 'committees', label: 'Committees', icon: UsersRound },
    { id: 'ads', label: 'Ads', icon: Megaphone },
    { id: 'registration', label: 'Registration Control', icon: Settings2 },
    { id: 'social', label: 'Social Content', icon: MessageSquare },
    { id: 'elections', label: 'Elections', icon: Vote },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'members':
        return <AdminMemberManager initialUsers={allUsers} viewerRole={viewerRole} />;
      case 'news':
        return <NewsManager initialNews={newsList} />;
      case 'committees':
        return <CommitteeBuilder initialTiers={committeeData} />;
      case 'ads':
        return <AdminAdManager initialAds={adsList as any} />;
      case 'registration':
        return <AdminRegistrationManager viewerRole={viewerRole} />;
      case 'social':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <AdminFeedManager initialPosts={allPosts as any} />
            <AdminStoryManager initialStories={allStories as any} />
          </div>
        );
      case 'elections':
        return (
          <AdminElectionManager 
            elections={activeElections} 
            analyticsData={analyticsData} 
            allCandidates={allCandidates}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto pb-1 gap-2 no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap shadow-sm border ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="w-full transition-all duration-300">
        {renderContent()}
      </div>
    </div>
  );
}
