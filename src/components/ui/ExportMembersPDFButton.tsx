'use client';

import { useState } from 'react';
import { FileText, Loader2, X, CheckSquare, Square, CreditCard, Table2 } from 'lucide-react';
import { exportMembersForPDF } from '@/app/actions/adminActions';
import { toTitleCase, toUpperCase, toSentenceCase } from '@/lib/formatters';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Field definitions ───────────────────────────────────────────────────────
type FieldKey = string;
interface FieldDef { label: string; key: FieldKey; group: string; }

const ALL_FIELDS: FieldDef[] = [
  { key: 'shortId',               label: 'Member ID',           group: 'Basic' },
  { key: 'fullName',              label: 'Full Name',            group: 'Basic' },
  { key: 'fatherName',            label: "Father's Name",        group: 'Basic' },
  { key: 'gender',                label: 'Gender',               group: 'Basic' },
  { key: 'dob',                   label: 'Date of Birth',        group: 'Basic' },
  { key: 'maritalStatus',         label: 'Marital Status',       group: 'Basic' },
  { key: 'bloodGroup',            label: 'Blood Group',          group: 'Basic' },
  { key: 'category',              label: 'Category',             group: 'Basic' },
  { key: 'role',                  label: 'Role',                 group: 'Basic' },
  { key: 'membershipType',        label: 'Membership',           group: 'Basic' },
  { key: 'paymentStatus',         label: 'Payment Status',       group: 'Basic' },
  { key: 'createdAt',             label: 'Joined On',            group: 'Basic' },
  { key: 'mobile',                label: 'Mobile',               group: 'Contact' },
  { key: 'email',                 label: 'Email',                group: 'Contact' },
  { key: 'state',                 label: 'State',                group: 'Contact' },
  { key: 'district',              label: 'District',             group: 'Contact' },
  { key: 'occupation',            label: 'Occupation',           group: 'Contact' },
  { key: 'degree',                label: 'Degree',               group: 'Doctor' },
  { key: 'batch',                 label: 'Batch Year',           group: 'Doctor' },
  { key: 'specialization',        label: 'Specialization',       group: 'Doctor' },
  { key: 'hospitalName',          label: 'Hospital/Clinic',      group: 'Doctor' },
  { key: 'presentWorkingPlace',   label: 'Working Place',        group: 'Doctor' },
  { key: 'registrationNo',        label: 'Registration No.',     group: 'Doctor' },
  { key: 'experience',            label: 'Experience (Yrs)',     group: 'Doctor' },
  { key: 'clinicAddress',         label: 'Clinic Address',       group: 'Doctor' },
  { key: 'consultationFee',       label: 'Consultation Fee',     group: 'Doctor' },
  { key: 'availabilityTimings',   label: 'Availability',         group: 'Doctor' },
  { key: 'memberships',           label: 'Memberships',          group: 'Doctor' },
  { key: 'awards',                label: 'Awards',               group: 'Doctor' },
  { key: 'college',               label: 'College',              group: 'Student' },
  { key: 'university',            label: 'University',           group: 'Student' },
  { key: 'course',                label: 'Course',               group: 'Student' },
  { key: 'year',                  label: 'Year',                 group: 'Student' },
  { key: 'collegeEntryYear',      label: 'Entry Year',           group: 'Student' },
  { key: 'gotraFather',           label: "Father's Gotra",       group: 'Student' },
  { key: 'gotraMother',           label: "Mother's Gotra",       group: 'Student' },
  { key: 'gotraGrandmother',      label: "Grandmother's Gotra",  group: 'Student' },
  { key: 'internshipStatus',      label: 'Internship Status',    group: 'Student' },
  { key: 'bloodDonationWillingness', label: 'Blood Donation',   group: 'Student' },
  { key: 'linkedinProfile',       label: 'LinkedIn',             group: 'Student' },
  { key: 'futureGoals',           label: 'Future Goals',         group: 'Student' },
  { key: 'hobbiesInterests',      label: 'Hobbies',              group: 'Student' },
];

const GROUPS = ['Basic', 'Contact', 'Doctor', 'Student'];
const DEFAULT_SELECTED = new Set(['fullName', 'fatherName', 'mobile', 'email', 'state', 'district', 'bloodGroup', 'category', 'membershipType']);

// Helper: load image via proxy as base64
const loadImageBase64 = (url: string): Promise<string | null> =>
  new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d');
      if (ctx) { ctx.drawImage(img, 0, 0); resolve(c.toDataURL('image/jpeg', 0.7)); }
      else resolve(null);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

interface ExportMembersPDFButtonProps {
  selectedIds?: string[];
}

type LayoutMode = 'table' | 'idcard';

export default function ExportMembersPDFButton({ selectedIds }: ExportMembersPDFButtonProps) {
  const [isPending,      setIsPending]      = useState(false);
  const [progress,       setProgress]       = useState('');
  const [showModal,      setShowModal]      = useState(false);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(DEFAULT_SELECTED));
  const [layout,         setLayout]         = useState<LayoutMode>('idcard');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy,         setSortBy]         = useState<string>('none');

  const toggleField = (key: string) =>
    setSelectedFields(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const toggleGroup = (group: string) => {
    const keys = ALL_FIELDS.filter(f => f.group === group).map(f => f.key);
    const allSel = keys.every(k => selectedFields.has(k));
    setSelectedFields(prev => { const n = new Set(prev); keys.forEach(k => allSel ? n.delete(k) : n.add(k)); return n; });
  };

  const CATEGORY_FILTERS = [
    { value: 'all',     label: 'All Members', color: 'gray'   },
    { value: 'doctor',  label: '🏥 Doctors',  color: 'blue'   },
    { value: 'student', label: '🎓 Students', color: 'purple' },
    { value: 'guest',   label: '👤 Guests',   color: 'green'  },
  ];

  const SORT_OPTIONS = [
    { value: 'none', label: 'Default Order' },
    { value: 'batchAsc', label: 'Batch Year (Ascending ▲)' },
    { value: 'batchDesc', label: 'Batch Year (Descending ▼)' },
    { value: 'entryYearAsc', label: 'Student Entry Year (Ascending ▲)' },
    { value: 'entryYearDesc', label: 'Student Entry Year (Descending ▼)' },
  ];

  // ── TABLE PDF ──────────────────────────────────────────────────────────────
  const buildTablePDF = async (data: any[]) => {
    const orderedFields = ALL_FIELDS.filter(f => selectedFields.has(f.key));
    const headers = orderedFields.map(f => f.label);
    const rows = data.map((m: any) => orderedFields.map(f => {
      const v = String(m[f.key] ?? '');
      // Format basic names/places
      if (['fullName', 'fatherName', 'state', 'district', 'college', 'hospitalName', 'occupation'].includes(f.key)) return toTitleCase(v);
      if (['bloodGroup', 'category', 'membershipType'].includes(f.key)) return toUpperCase(v);
      return v;
    }));

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(30, 58, 138);
    doc.text('DDA Member Directory', 148, 12, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(130, 130, 130);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}  •  ${data.length} members`, 148, 19, { align: 'center' });

    autoTable(doc, {
      head: [headers], body: rows, startY: 24,
      styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
      alternateRowStyles: { fillColor: [245, 247, 255] },
      margin: { left: 6, right: 6 },
    });
    doc.save(`DDA_Table_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // ── ID CARD PDF  (2 cols × 5 rows = 10 per A4 page) ───────────────────────
  const buildIdCardPDF = async (data: any[]) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Layout constants
    const COLS = 2, ROWS = 4, PER_PAGE = COLS * ROWS;
    const marginX = 8, marginTop = 22, marginBot = 8;
    const gapX = 5, gapY = 4;
    const pageW = 210, pageH = 297;
    const cardW = (pageW - 2 * marginX - gapX) / COLS;                          // ≈93.5 mm
    const cardH = (pageH - marginTop - marginBot - (ROWS - 1) * gapY) / ROWS;   // ≈49.4 mm
    const RIBBON_H = 7;
    const SHOW_PHOTO = true; // always try to show photo
    const PHOTO_SIZE = 16;

    // Which extra text fields to show on card (in order, skipping fullName which is always title)
    const cardFields = ALL_FIELDS.filter(f => selectedFields.has(f.key) && f.key !== 'fullName');

    let page = 0;

    for (let i = 0; i < data.length; i++) {
      const posOnPage = i % PER_PAGE;

      if (posOnPage === 0) {
        if (i > 0) doc.addPage();
        page++;
        // Page header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(30, 58, 138);
        doc.text('Dhakad Doctors Association — Member Directory', pageW / 2, 14, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 160);
        doc.text(`Page ${page}  •  ${new Date().toLocaleDateString('en-IN')}`, pageW - marginX, 14, { align: 'right' });
      }

      const col = posOnPage % COLS;
      const row = Math.floor(posOnPage / COLS);
      const x = marginX + col * (cardW + gapX);
      const y = marginTop + row * (cardH + gapY);

      const member = data[i];

      // Card background + border
      doc.setDrawColor(200, 210, 230);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, y, cardW, cardH, 2.5, 2.5, 'FD');

      // Blue header ribbon
      doc.setFillColor(30, 58, 138);
      doc.roundedRect(x, y, cardW, RIBBON_H, 2.5, 2.5, 'F');
      doc.setFillColor(30, 58, 138);
      doc.rect(x, y + 2, cardW, RIBBON_H - 2, 'F'); // square bottom of ribbon
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text('DHAKAD DOCTORS ASSOCIATION', x + cardW / 2, y + 4.8, { align: 'center' });

      // Photo
      let photoX = x + 3;
      let textX = x + 3;
      if (SHOW_PHOTO) {
        const photoY = y + RIBBON_H + 3;
        let imgData: string | null = null;
        if (member.avatarUrl) {
          const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(member.avatarUrl)}`;
          imgData = await loadImageBase64(proxyUrl);
        }
        if (imgData) {
          doc.addImage(imgData, 'JPEG', photoX, photoY, PHOTO_SIZE, PHOTO_SIZE);
        } else {
          doc.setFillColor(225, 232, 245);
          doc.roundedRect(photoX, photoY, PHOTO_SIZE, PHOTO_SIZE, 1.5, 1.5, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(120, 140, 180);
          const initial = (member.fullName || '?').charAt(0).toUpperCase();
          doc.text(initial, photoX + PHOTO_SIZE / 2, photoY + PHOTO_SIZE / 1.6, { align: 'center' });
        }
        textX = photoX + PHOTO_SIZE + 3;
      }

      // Name
      let textY = y + RIBBON_H + 7;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      const nameMaxW = cardW - (textX - x) - 3;
      const formattedName = toTitleCase(member.fullName || 'Unknown');
      const nameLines = doc.splitTextToSize(formattedName, nameMaxW);
      doc.text(nameLines[0], textX, textY);
      textY += 4.5;

      // Category badge
      const cat = (member.category || 'GUEST').toUpperCase();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(60, 100, 200);
      doc.text(cat, textX, textY);
      textY += 4;

      // Extra fields — 2 columns per row
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(70, 70, 70);
      const maxTextY = y + cardH - 6;
      const halfW = nameMaxW / 2 - 1;               // width of each column
      const rightColX = textX + halfW + 2;           // X start of right column

      const nonEmptyFields = cardFields.filter(f => String(member[f.key] || '').trim() !== '');

      const formatField = (key: string, val: string) => {
        if (['fatherName', 'state', 'district', 'college', 'hospitalName', 'occupation'].includes(key)) return toTitleCase(val);
        if (['bloodGroup'].includes(key)) return toUpperCase(val);
        return val;
      };

      for (let fi = 0; fi < nonEmptyFields.length; fi += 2) {
        if (textY >= maxTextY) break;

        // Left column
        const fl = nonEmptyFields[fi];
        const vl = formatField(fl.key, String(member[fl.key] || ''));
        const leftText = doc.splitTextToSize(`${fl.label}: ${vl}`, halfW);
        doc.text(leftText[0], textX, textY);

        // Right column (if exists)
        if (fi + 1 < nonEmptyFields.length) {
          const fr = nonEmptyFields[fi + 1];
          const vr = formatField(fr.key, String(member[fr.key] || ''));
          const rightText = doc.splitTextToSize(`${fr.label}: ${vr}`, halfW);
          doc.text(rightText[0], rightColX, textY);
        }

        textY += 3.6;
      }

      // Bottom strip — ID + Membership
      const botY = y + cardH - 3;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(140, 140, 140);
      doc.text(`ID: ${member.shortId}`, x + 3, botY);
      doc.text((member.membershipType || '').toUpperCase(), x + cardW - 3, botY, { align: 'right' });

      // Bottom border line
      doc.setDrawColor(220, 230, 245);
      doc.line(x + 2, botY - 1.5, x + cardW - 2, botY - 1.5);

      setProgress(`Processing ${i + 1}/${data.length}...`);
    }

    doc.save(`DDA_ID_Cards_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // ── Main handler ───────────────────────────────────────────────────────────
  const handleExport = async () => {
    if (selectedFields.size === 0) { alert('Select at least one field.'); return; }
    setIsPending(true);
    setProgress('Fetching data...');
    try {
      const res = await exportMembersForPDF(selectedIds, categoryFilter);
      if (!res.success || !res.data) { alert(res.message || 'Failed'); return; }

      // Apply sorting if selected
      let finalData = [...res.data];
      if (sortBy !== 'none') {
        finalData.sort((a: any, b: any) => {
          if (sortBy === 'batchAsc' || sortBy === 'batchDesc') {
            const valA = parseInt(a.batch) || 0;
            const valB = parseInt(b.batch) || 0;
            return sortBy === 'batchAsc' ? valA - valB : valB - valA;
          }
          if (sortBy === 'entryYearAsc' || sortBy === 'entryYearDesc') {
            const valA = parseInt(a.collegeEntryYear) || 0;
            const valB = parseInt(b.collegeEntryYear) || 0;
            return sortBy === 'entryYearAsc' ? valA - valB : valB - valA;
          }
          return 0;
        });
      }

      if (layout === 'table') await buildTablePDF(finalData);
      else await buildIdCardPDF(finalData);
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert('Error generating PDF');
    } finally {
      setIsPending(false);
      setProgress('');
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors border border-red-100 shadow-sm"
      >
        <FileText className="w-4 h-4" />
        {selectedIds && selectedIds.length > 0 ? `Export Selected (${selectedIds.length})` : 'Export PDF'}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Export PDF</h3>
                <p className="text-sm text-gray-500 mt-0.5">Choose layout &amp; select fields</p>
              </div>
              <button onClick={() => !isPending && setShowModal(false)} disabled={isPending}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-700" />
              </button>
            </div>

            {/* Layout toggle */}
            <div className="px-6 pt-4 flex gap-3 flex-wrap">
              <button
                onClick={() => setLayout('idcard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-semibold text-sm transition-all ${layout === 'idcard' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                <CreditCard className="w-4 h-4" /> ID Card (8/page)
              </button>
              <button
                onClick={() => setLayout('table')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-semibold text-sm transition-all ${layout === 'table' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                <Table2 className="w-4 h-4" /> Table List
              </button>
            </div>

            {/* Category filter & Sort */}
            <div className="px-6 pt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Category */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Filter by Category</p>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORY_FILTERS.map(f => (
                    <button
                      key={f.value}
                      onClick={() => setCategoryFilter(f.value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
                        categoryFilter === f.value
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Sort */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Sort By</p>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Field picker */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
              <div className="flex gap-4 items-center">
                <button onClick={() => setSelectedFields(new Set(ALL_FIELDS.map(f => f.key)))} className="text-xs font-semibold text-blue-600 flex items-center gap-1 hover:underline">
                  <CheckSquare className="w-3.5 h-3.5" /> All
                </button>
                <button onClick={() => setSelectedFields(new Set())} className="text-xs font-semibold text-gray-400 flex items-center gap-1 hover:underline">
                  <Square className="w-3.5 h-3.5" /> Clear
                </button>
                <span className="ml-auto text-xs text-gray-400">{selectedFields.size} selected</span>
              </div>

              {GROUPS.map(group => {
                const gFields = ALL_FIELDS.filter(f => f.group === group);
                const allSel = gFields.every(f => selectedFields.has(f.key));
                const colorMap: Record<string, string> = { Basic: 'text-blue-700', Contact: 'text-green-700', Doctor: 'text-purple-700', Student: 'text-orange-600' };
                return (
                  <div key={group}>
                    <button onClick={() => toggleGroup(group)} className={`flex items-center gap-2 text-sm font-bold mb-2 ${colorMap[group]}`}>
                      {allSel ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      {group}
                    </button>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {gFields.map(f => (
                        <label key={f.key} className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-gray-50">
                          <input type="checkbox" checked={selectedFields.has(f.key)} onChange={() => toggleField(f.key)} disabled={isPending} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                          <span className="text-sm text-gray-700">{f.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100">
              <button
                onClick={handleExport}
                disabled={isPending || selectedFields.size === 0}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                {isPending ? progress : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
