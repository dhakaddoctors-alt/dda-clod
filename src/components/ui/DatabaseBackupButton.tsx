'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { exportDatabaseSnapshot } from '@/app/actions/adminActions'; // Will be created next

export default function DatabaseBackupButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleBackup = async () => {
    setIsExporting(true);
    try {
      const result = await exportDatabaseSnapshot();
      if (result.success && result.snapshot) {
        // Create a Blob from the JSON string
        const blob = new Blob([result.snapshot], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        
        // Formulate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `dda_database_backup_${timestamp}.json`;

        // Create a hidden link and trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert(result.message || 'Failed to generate backup.');
      }
    } catch (error) {
      console.error('Backup error:', error);
      alert('An unexpected error occurred during backup.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button 
      onClick={handleBackup}
      disabled={isExporting}
      className={`w-full py-2 bg-white text-blue-700 rounded-lg text-sm font-bold shadow-sm flex justify-center items-center gap-2 transition-colors relative z-10 ${
        isExporting ? 'opacity-75 cursor-not-allowed' : 'hover:bg-gray-50'
      }`}
    >
      {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {isExporting ? 'Generating...' : 'Trigger Manual Backup'}
    </button>
  );
}
