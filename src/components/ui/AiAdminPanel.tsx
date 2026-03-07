'use client';

import { useState, useTransition } from 'react';
import { runDailyMembershipCron } from '@/app/actions/membershipActions';
import { triggerSmartPushNotification } from '@/app/actions/aiActions';
import { Activity, Bell, Sparkles } from 'lucide-react';

export default function AiAdminPanel() {
  const [isPending, startTransition] = useTransition();
  const [logs, setLogs] = useState<string[]>([]);

  const handleCron = () => {
    startTransition(async () => {
       setLogs(prev => ['[SYSTEM] Triggering DB Expiry Scan...', ...prev]);
       const res = await runDailyMembershipCron();
       setLogs(prev => [`[SUCCESS] Expiry Cron Processed ${res.processed} records.`, ...prev]);
    });
  };

  const handlePush = () => {
    startTransition(async () => {
       setLogs(prev => ['[AI ENGINE] Analyzing profiles for Renewal Push...', ...prev]);
       const res = await triggerSmartPushNotification('profile_1', 'renewal');
       if (res.success) {
           setLogs(prev => [`[SENT] Push Triggered: "${res.messageSent}"`, ...prev]);
       } else {
           setLogs(prev => ['[FAILED] AI Push Engine Error', ...prev]);
       }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-600" />
        AI & Automation Hub
      </h2>
      
      <div className="flex gap-3 mb-4">
        <button 
           onClick={handleCron}
           disabled={isPending}
           className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
        >
           <Activity className="w-4 h-4" /> Run Expiry Cron
        </button>
        <button 
           onClick={handlePush}
           disabled={isPending}
           className="flex-1 flex items-center justify-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
        >
           <Bell className="w-4 h-4" /> Test AI Push
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 h-40 overflow-y-auto font-mono text-xs text-green-400">
        <p className="text-gray-500 mb-2">// System Action Logs</p>
        {logs.map((log, i) => (
           <p key={i} className="mb-1">{log}</p>
        ))}
        {logs.length === 0 && <p className="text-gray-600 italic">Waiting for manual triggers...</p>}
      </div>
    </div>
  );
}
