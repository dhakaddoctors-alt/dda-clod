'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Ad {
  id: string;
  businessName: string;
  contactPerson: string;
  mobile: string;
  imageUrls: string; // JSON string
  linkUrl: string | null;
  status: string;
  createdAt: Date;
}

export default function ExportAdsPDFButton({ ads }: { ads: Ad[] }) {
  const [isPending, setIsPending] = useState(false);

  const handleExport = () => {
    setIsPending(true);
    console.log('[PDF] Starting export for', ads.length, 'records');
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(18);
      doc.setTextColor(30, 58, 138); // blue-900
      doc.text('Advertisement Requests Report', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Total Records: ${ads.length}`, 14, 35);

      const tableData = ads.map((ad, index) => [
        index + 1,
        ad.businessName,
        ad.contactPerson,
        ad.mobile,
        ad.status.toUpperCase(),
        new Date(ad.createdAt).toLocaleDateString(),
        ad.linkUrl || 'N/A'
      ]);

      autoTable(doc, {
        startY: 45,
        head: [['#', 'Business', 'Contact', 'Mobile', 'Status', 'Date', 'Link']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, font: 'helvetica' },
        columnStyles: {
            0: { cellWidth: 10 },
            4: { fontStyle: 'bold' }
        }
      });

      console.log('[PDF] Generation successful, saving...');
      doc.save(`Ad_Requests_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Failed to generate PDF report. Check console for details.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isPending || ads.length === 0}
      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed"
    >
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
      Export PDF
    </button>
  );
}
