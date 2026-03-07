'use client';

import { useState } from 'react';
import { FileText, Loader2, X } from 'lucide-react';
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
        resolve(canvas.toDataURL("image/jpeg", 0.7)); // Compress
      } else resolve(null);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

export default function ExportMembersPDFButton() {
  const [isPending, setIsPending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showModal, setShowModal] = useState(false);
  
  const [options, setOptions] = useState({
    showAvatar: true,
    showRole: true,
    showProfession: true,
    showContact: true,
    showId: true
  });

  const handleToggle = (key: keyof typeof options) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

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
          let avatarSize = 0;
          let textX = x + 4; // default
          let avatarY = y + 12;

          if (options.showAvatar) {
            avatarSize = 18;
            const avatarX = x + 4;

            let imgData = null;
            if (member.avatarUrl) {
              imgData = await loadImageBase64(member.avatarUrl);
            }
            
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
            textX = avatarX + avatarSize + 4;
          }

          // Details Section
          let textY = y + 16;
          
          // Name 
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(10, 10, 10);
          const nameLines = doc.splitTextToSize(member.fullName, cardW - textX - 2 + x);
          doc.text(nameLines[0] || 'Unknown', textX, textY);
          
          if (options.showRole) {
            // Role & Badge
            textY += 4.5;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.setTextColor(80, 80, 80);
            doc.text(`${member.role} • ${member.membership}`, textX, textY);
          }

          if (options.showProfession) {
            // Profession Details block
            textY += 5;
            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            const rawProf = member.professionDetails ? member.professionDetails.replace(/\n/g, ', ') : '';
            const profLines = doc.splitTextToSize(rawProf, cardW - textX - 2 + x);
            doc.text(profLines.slice(0, 2), textX, textY);
          }

          // Contact (Bottom row alignment)
          doc.setFontSize(6);
          doc.setTextColor(130, 130, 130);
          const bottomY = y + cardH - 4;
          
          if (options.showId) {
            doc.text(`ID: ${member.id}`, x + 4, bottomY);
          }
          if (options.showContact) {
            const rawContact = member.contact ? member.contact.replace(/\n/g, ' | ') : '';
            doc.text(rawContact, x + cardW - 4, bottomY, { align: 'right' });
          }
        }

        // Output PDF
        doc.save(`DDA_Directory_Cards_${new Date().toISOString().split('T')[0]}.pdf`);
        setShowModal(false); // Close modal on success
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
    <>
      <button 
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors"
      >
        <FileText className="w-4 h-4" /> 
        Export ID Directory
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl relative">
            <button 
              onClick={() => !isPending && setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
              disabled={isPending}
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-bold text-gray-900 mb-1">Export Directory</h3>
            <p className="text-sm text-gray-500 mb-6">Select fields to include in the ID cards.</p>

            <div className="space-y-4 mb-8">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={options.showAvatar} onChange={() => handleToggle('showAvatar')} disabled={isPending} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                <span className="text-sm font-medium text-gray-700">Profile Photo</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={options.showRole} onChange={() => handleToggle('showRole')} disabled={isPending} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                <span className="text-sm font-medium text-gray-700">Role & Membership</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={options.showProfession} onChange={() => handleToggle('showProfession')} disabled={isPending} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                <span className="text-sm font-medium text-gray-700">Professional Details</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={options.showContact} onChange={() => handleToggle('showContact')} disabled={isPending} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                <span className="text-sm font-medium text-gray-700">Contact Number & Email</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={options.showId} onChange={() => handleToggle('showId')} disabled={isPending} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                <span className="text-sm font-medium text-gray-700">Member ID Number</span>
              </label>
            </div>

            <button
              onClick={handleExportPDF}
              disabled={isPending}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-all shadow-sm
                ${isPending ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 active:scale-[0.98]'}`}
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
              {isPending ? `Building IDs ${progress}%` : 'Generate PDF'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
