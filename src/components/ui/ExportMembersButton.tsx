'use client';

import { useState, useTransition } from 'react';
import { DownloadCloud } from 'lucide-react';
import { exportMembersToCSV } from '@/app/actions/adminActions';

export default function ExportMembersButton() {
  const [isPending, startTransition] = useTransition();

  const handleExport = () => {
    startTransition(async () => {
      const res = await exportMembersToCSV();
      if (res.success && res.csv) {
        // Create a blob and trigger download in browser
        const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `DDA_Members_Export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        alert(res.message || 'Failed to export members');
      }
    });
  };

  return (
    <button 
      onClick={handleExport}
      disabled={isPending}
      className="flex items-center gap-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
    >
      <DownloadCloud className="w-4 h-4" /> 
      {isPending ? 'Generating CSV...' : 'Export Members CSV'}
    </button>
  );
}
