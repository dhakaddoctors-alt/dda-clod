'use client';

import { BarChart, Users, Medal, Activity } from 'lucide-react';

interface CandidateAnalytics {
  id: string;
  name: string;
  votes: number;
  percentage: number;
}

interface AnalyticsData {
  totalVotesCast: number;
  totalEligibleVoters: number;
  participationRate: string;
  candidates: CandidateAnalytics[];
}

export default function ElectionAnalyticsPanel({ data }: { data: AnalyticsData | null }) {
  if (!data) return null;

  // Find the current leader
  const sortedCandidates = [...data.candidates].sort((a, b) => b.votes - a.votes);
  const leader = sortedCandidates[0];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8 mt-8">
      <div className="flex items-center gap-2 mb-6">
        <BarChart className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">Live Election Analytics (Gupt Matdaan)</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-800 uppercase tracking-wider">Total Ballots Cast</p>
            <p className="text-2xl font-bold text-gray-900">{data.totalVotesCast.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-green-50 rounded-xl p-4 border border-green-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-600 text-white rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800 uppercase tracking-wider">Participation Rate</p>
            <p className="text-2xl font-bold text-gray-900">{data.participationRate}</p>
            <p className="text-xs text-gray-500">Out of {data.totalEligibleVoters.toLocaleString()} voters</p>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-500 text-white rounded-lg flex items-center justify-center">
            <Medal className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-yellow-800 uppercase tracking-wider">Current Leader</p>
            <p className="text-xl font-bold text-gray-900 line-clamp-1">{leader?.name || 'N/A'}</p>
            <p className="text-xs text-gray-500">{leader?.votes} votes ({leader?.percentage}%)</p>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Candidate Vote Distribution</h3>
      <div className="space-y-6">
         {sortedCandidates.map((candidate) => (
           <div key={candidate.id}>
              <div className="flex justify-between items-end mb-2">
                <div>
                   <span className="font-bold text-gray-900">{candidate.name}</span>
                   <span className="text-sm text-gray-500 ml-2">({candidate.votes.toLocaleString()} votes)</span>
                </div>
                <span className="font-bold text-blue-600">{candidate.percentage}%</span>
              </div>
              <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-in-out" 
                   style={{ width: `${candidate.percentage}%` }}
                 ></div>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
}
