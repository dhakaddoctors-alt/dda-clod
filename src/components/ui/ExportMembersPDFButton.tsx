'use client';

import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { exportMembersForPDF } from '@/app/actions/adminActions';
import jsPDF from 'jspdf';

// Helper to convert image URL to base64
const loadImageBase64 = (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if(ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.7)); // Compress for PDF weight
      } else resolve(null);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

export default function ExportMembersPDFButton() {
  const [isPending, setIsPending] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleExportPDF = async () => {
    setIsPending(true);
    setProgress(0);
    
    try {
      const res = await exportMembersForPDF();
      
      if (res.success && res.data) {
        const doc = new jsPDF('portrait', 'mm', 'a4');
        const totalMembers = res.data.length;
        
        let pageNum = 1;
        const membersPerPage = 8;
        
        const cardW = 85;
        const cardH = 55;
        const startX = 15;
        const startY = 25;
        const gapX = 10;
        const gapY = 10;

        for (let i = 0; i < res.data.length; i++) {
          setProgress(Math.round(((i + 1) / totalMembers) * 100));
          
          if (i > 0 && i % membersPerPage === 0) {
            doc.addPage();
            pageNum++;
          }
          
          if (i % membersPerPage === 0) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.setTextColor(30, 58, 138); // blue-900
            doc.text('DDA Member Directory', 105, 15, { align: "center" });
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(`Page ${pageNum}`, 195, 15, { align: "right" });
          }

          const member = res.data[i];
          const posOnPage = i % membersPerPage;
          const col = posOnPage % 2;
          const row = Math.floor(posOnPage / 2);
          
          const x = startX + (cardW + gapX) * col;
          const y = startY + (cardH + gapY) * row;

          // Draw Card Border
          doc.setDrawColor(200, 200, 200);
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(x, y, cardW, cardH, 2, 2, 'FD');

          // Header Ribbon
          doc.setFillColor(30, 58, 138); 
          doc.rect(x, y, cardW, 8, 'F');
          
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(255, 255, 255);
          doc.text("Dhakad Doctors Association", x + cardW / 2, y + 5.5, { align: "center" });

          // Avatar Box
          let imgData = null;
          if (member.avatarUrl) {
            imgData = await loadImageBase64(member.avatarUrl);
          }
          
          const avatarSize = 18;
          const avatarX = x + 4;
          const avatarY = y + 12;

          if (imgData) {
            doc.addImage(imgData, 'JPEG', avatarX, avatarY, avatarSize, avatarSize);
          } else {
            doc.setFillColor(230, 230, 230);
            doc.rect(avatarX, avatarY, avatarSize, avatarSize, 'F');
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            const initial = member.fullName ? member.fullName.charAt(0).toUpperCase() : '?';
            doc.text(initial, avatarX + avatarSize / 2, avatarY + avatarSize / 1.5, { align: "center" });
          }

          // Details Section
          const textX = avatarX + avatarSize + 4;
          let textY = y + 16;
          
          // Name 
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(10, 10, 10);
          const nameLines = doc.splitTextToSize(member.fullName, cardW - textX - 2 + x);
          doc.text(nameLines[0] || 'Unknown', textX, textY);
          
          // Role & Badge
          textY += 4.5;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(80, 80, 80);
          doc.text(`${member.role} • ${member.membership}`, textX, textY);

          // Profession Details block
          textY += 5;
          doc.setFontSize(7);
          doc.setTextColor(100, 100, 100);
          const rawProf = member.professionDetails ? member.professionDetails.replace(/\n/g, ', ') : '';
          const profLines = doc.splitTextToSize(rawProf, cardW - textX - 2 + x);
          doc.text(profLines.slice(0, 2), textX, textY);

          // Contact (Bottom row alignment)
          doc.setFontSize(6);
          doc.setTextColor(130, 130, 130);
          const bottomY = y + cardH - 4;
          doc.text(`ID: ${member.id}`, x + 4, bottomY);
          const rawContact = member.contact ? member.contact.replace(/\n/g, ' | ') : '';
          doc.text(rawContact, x + cardW - 4, bottomY, { align: 'right' });
        }

        // Output PDF
        doc.save(`DDA_Directory_Cards_${new Date().toISOString().split('T')[0]}.pdf`);
      } else {
        alert(res.message || 'Failed to generate PDF');
      }
    } catch (err) {
      console.error(err);
      alert('Error generating PDF Directory');
    } finally {
      setIsPending(false);
      setProgress(0);
    }
  };

  return (
    <button 
      onClick={handleExportPDF}
      disabled={isPending}
      className={`flex items-center gap-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors ${isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
      {isPending ? `Building IDs ${progress}%` : 'Export ID Directory'}
    </button>
  );
}
