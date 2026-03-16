'use client';

import { useState } from 'react';
import { FileText, Loader2, X, CheckSquare, Square } from 'lucide-react';
import { exportMembersForPDF } from '@/app/actions/adminActions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Field definitions ──────────────────────────────────────────────────────
type FieldKey = string;
interface FieldDef { label: string; key: FieldKey; group: string; }

const ALL_FIELDS: FieldDef[] = [
  // Basic
  { key: 'shortId',       label: 'Member ID',          group: 'Basic' },
  { key: 'fullName',      label: 'Full Name',           group: 'Basic' },
  { key: 'fatherName',    label: "Father's Name",       group: 'Basic' },
  { key: 'gender',        label: 'Gender',              group: 'Basic' },
  { key: 'dob',           label: 'Date of Birth',       group: 'Basic' },
  { key: 'maritalStatus', label: 'Marital Status',      group: 'Basic' },
  { key: 'bloodGroup',    label: 'Blood Group',         group: 'Basic' },
  { key: 'category',      label: 'Category',            group: 'Basic' },
  { key: 'role',          label: 'Role',                group: 'Basic' },
  { key: 'membershipType',label: 'Membership',          group: 'Basic' },
  { key: 'paymentStatus', label: 'Payment Status',      group: 'Basic' },
  { key: 'createdAt',     label: 'Joined On',           group: 'Basic' },
  // Contact
  { key: 'mobile',        label: 'Mobile',              group: 'Contact' },
  { key: 'email',         label: 'Email',               group: 'Contact' },
  { key: 'state',         label: 'State',               group: 'Contact' },
  { key: 'district',      label: 'District',            group: 'Contact' },
  { key: 'occupation',    label: 'Occupation',          group: 'Contact' },
  // Doctor
  { key: 'degree',              label: 'Degree',              group: 'Doctor' },
  { key: 'specialization',      label: 'Specialization',      group: 'Doctor' },
  { key: 'hospitalName',        label: 'Hospital/Clinic',     group: 'Doctor' },
  { key: 'presentWorkingPlace', label: 'Working Place',       group: 'Doctor' },
  { key: 'registrationNo',      label: 'Registration No.',    group: 'Doctor' },
  { key: 'experience',          label: 'Experience (Yrs)',    group: 'Doctor' },
  { key: 'clinicAddress',       label: 'Clinic Address',      group: 'Doctor' },
  { key: 'consultationFee',     label: 'Consultation Fee',    group: 'Doctor' },
  { key: 'availabilityTimings', label: 'Availability',        group: 'Doctor' },
  { key: 'memberships',         label: 'Memberships',         group: 'Doctor' },
  { key: 'awards',              label: 'Awards',              group: 'Doctor' },
  // Student
  { key: 'college',                label: 'College',               group: 'Student' },
  { key: 'university',             label: 'University',             group: 'Student' },
  { key: 'course',                 label: 'Course',                 group: 'Student' },
  { key: 'year',                   label: 'Year',                   group: 'Student' },
  { key: 'collegeEntryYear',       label: 'Entry Year',             group: 'Student' },
  { key: 'gotraFather',            label: "Father's Gotra",         group: 'Student' },
  { key: 'gotraMother',            label: "Mother's Gotra",         group: 'Student' },
  { key: 'gotraGrandmother',       label: "Grandmother's Gotra",    group: 'Student' },
  { key: 'internshipStatus',       label: 'Internship Status',      group: 'Student' },
  { key: 'bloodDonationWillingness', label: 'Blood Donation',       group: 'Student' },
  { key: 'linkedinProfile',        label: 'LinkedIn',               group: 'Student' },
  { key: 'futureGoals',            label: 'Future Goals',           group: 'Student' },
  { key: 'hobbiesInterests',       label: 'Hobbies',                group: 'Student' },
];

const GROUPS = ['Basic', 'Contact', 'Doctor', 'Student'];
const GROUP_COLORS: Record<string, string> = {
  Basic: 'blue', Contact: 'green', Doctor: 'purple', Student: 'orange'
};

const DEFAULT_SELECTED = ['fullName', 'fatherName', 'mobile', 'email', 'state', 'district', 'bloodGroup', 'category', 'membershipType'];

interface ExportMembersPDFButtonProps {
  selectedIds?: string[];
}

export default function ExportMembersPDFButton({ selectedIds }: ExportMembersPDFButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [progress, setProgress] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(DEFAULT_SELECTED));

  const toggleField = (key: string) => {
    setSelectedFields(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleGroup = (group: string) => {
    const groupKeys = ALL_FIELDS.filter(f => f.group === group).map(f => f.key);
    const allSelected = groupKeys.every(k => selectedFields.has(k));
    setSelectedFields(prev => {
      const next = new Set(prev);
      groupKeys.forEach(k => allSelected ? next.delete(k) : next.add(k));
      return next;
    });
  };

  const selectAll = () => setSelectedFields(new Set(ALL_FIELDS.map(f => f.key)));
  const clearAll  = () => setSelectedFields(new Set());

  const handleExportPDF = async () => {
    if (selectedFields.size === 0) { alert('Please select at least one field.'); return; }
    setIsPending(true);
    setProgress('Fetching data...');

    try {
      const res = await exportMembersForPDF(selectedIds);
      if (!res.success || !res.data) { alert(res.message || 'Failed'); return; }

      setProgress('Building PDF...');

      // Ordered columns the user chose
      const orderedFields = ALL_FIELDS.filter(f => selectedFields.has(f.key));
      const headers = orderedFields.map(f => f.label);

      const rows = res.data.map((member: any) =>
        orderedFields.map(f => String(member[f.key] ?? ''))
      );

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(30, 58, 138);
      doc.text('DDA Member Directory Export', 148, 13, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}  |  Total: ${res.data.length} members`, 148, 20, { align: 'center' });

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 25,
        styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
        alternateRowStyles: { fillColor: [245, 247, 255] },
        margin: { left: 8, right: 8 },
        tableWidth: 'auto',
      });

      doc.save(`DDA_Export_${new Date().toISOString().split('T')[0]}.pdf`);
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
                <p className="text-sm text-gray-500 mt-0.5">Select the columns you want in the PDF</p>
              </div>
              <button onClick={() => !isPending && setShowModal(false)} disabled={isPending}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-700" />
              </button>
            </div>

            {/* Field Selector */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
              {/* Quick actions */}
              <div className="flex gap-3">
                <button onClick={selectAll} className="text-xs font-semibold text-blue-600 flex items-center gap-1 hover:underline">
                  <CheckSquare className="w-3.5 h-3.5" /> Select All
                </button>
                <button onClick={clearAll} className="text-xs font-semibold text-gray-400 flex items-center gap-1 hover:underline">
                  <Square className="w-3.5 h-3.5" /> Clear All
                </button>
                <span className="ml-auto text-xs text-gray-400">{selectedFields.size} fields selected</span>
              </div>

              {/* Groups */}
              {GROUPS.map(group => {
                const groupFields = ALL_FIELDS.filter(f => f.group === group);
                const allGroupSelected = groupFields.every(f => selectedFields.has(f.key));
                const color = GROUP_COLORS[group];
                return (
                  <div key={group}>
                    <button
                      onClick={() => toggleGroup(group)}
                      className={`flex items-center gap-2 text-sm font-bold mb-2 ${
                        color === 'blue' ? 'text-blue-700' :
                        color === 'green' ? 'text-green-700' :
                        color === 'purple' ? 'text-purple-700' : 'text-orange-700'
                      }`}
                    >
                      {allGroupSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      {group} Fields
                    </button>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {groupFields.map(f => (
                        <label key={f.key} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={selectedFields.has(f.key)}
                            onChange={() => toggleField(f.key)}
                            disabled={isPending}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600"
                          />
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
                onClick={handleExportPDF}
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
