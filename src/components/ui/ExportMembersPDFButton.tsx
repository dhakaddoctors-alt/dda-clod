'use client';

import { useState, useTransition } from 'react';
import { FileText } from 'lucide-react';
import { exportMembersForPDF } from '@/app/actions/adminActions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ExportMembersPDFButton() {
  const [isPending, startTransition] = useTransition();

  const handleExportPDF = () => {
    startTransition(async () => {
      const res = await exportMembersForPDF();
      
      if (res.success && res.data) {
        const doc = new jsPDF('landscape');
        
        doc.setFontSize(18);
        doc.text('Dhakad Doctors Association - Member Directory', 14, 20);
        doc.setFontSize(11);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

        const tableColumn = ["ID", "Full Name", "Contact (Phone/Email)", "Role", "Membership", "Status", "Joined Date"];
        const tableRows = res.data.map((member: any) => [
          member.id,
          member.fullName,
          member.contact,
          member.role,
          member.membership,
          member.status,
          member.date
        ]);

        autoTable(doc, {
          startY: 35,
          head: [tableColumn],
          body: tableRows,
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [30, 58, 138], textColor: 255 }, // blue-900 theme
          alternateRowStyles: { fillColor: [249, 250, 251] },
        });

        // Save PDF
        doc.save(`DDA_Members_Export_${new Date().toISOString().split('T')[0]}.pdf`);
      } else {
        alert(res.message || 'Failed to generate PDF');
      }
    });
  };

  return (
    <button 
      onClick={handleExportPDF}
      disabled={isPending}
      className="flex items-center gap-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
    >
      <FileText className="w-4 h-4" /> 
      {isPending ? 'Generating PDF...' : 'Export PDF'}
    </button>
  );
}
