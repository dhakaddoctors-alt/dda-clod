'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Award } from 'lucide-react';

interface IdCardProps {
  id: string;
  name: string;
  role: string;
  membershipType: string;
  avatarUrl?: string;
  bloodGroup?: string;
  validUntil?: string;
}

export default function IdCard({ id, name, role, membershipType, avatarUrl, bloodGroup, validUntil }: IdCardProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    // Generate QR Code containing the profile verification URL
    const generateQR = async () => {
      try {
        const url = `${window.location.origin}/directory/${id}`;
        const dataUrl = await QRCode.toDataURL(url, {
          width: 80,
          margin: 1,
          color: {
            dark: '#1e3a8a', // blue-900
            light: '#ffffff'
          }
        });
        setQrCodeUrl(dataUrl);
      } catch (err) {
        console.error('Error generating QR:', err);
      }
    };
    generateQR();
  }, [id]);

  const handleDownload = () => {
    // Basic print trigger. In a production app, we could use html2canvas to save a PNG.
    window.print();
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* The Printable Card Area */}
      <div id="id-card" className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 relative mb-6">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-4 text-center">
          <h2 className="text-white font-bold tracking-widest text-lg uppercase">DDA Portal</h2>
          <p className="text-blue-100 text-xs">Dhakad Doctors Association</p>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col items-center relative z-10">
          {/* Avatar Profile */}
          <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 -mt-12 mb-3 relative z-20">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400 bg-gray-100">
                {name.charAt(0)}
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1">{name}</h3>
          
          <div className="flex items-center gap-2 mb-4">
             <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide">
               {role}
             </span>
             {membershipType === 'aajivan' && (
                <span className="bg-yellow-100 text-yellow-800 flex items-center gap-1 text-xs px-2 py-1 rounded-full font-bold leading-none">
                  <Award className="w-3 h-3" /> Life Member
                </span>
             )}
          </div>

          <div className="w-full bg-gray-50 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs mb-4 border border-gray-100">
            <div>
              <p className="text-gray-500 uppercase font-semibold text-[10px]">Portal ID</p>
              <p className="font-medium text-gray-900 line-clamp-1">{id.split('_')[1] || id}</p>
            </div>
            <div>
              <p className="text-gray-500 uppercase font-semibold text-[10px]">Blood Group</p>
              <p className="font-medium text-gray-900">{bloodGroup || 'Not Specs'}</p>
            </div>
            <div className="col-span-2 mt-1 pt-2 border-t border-gray-200">
              <p className="text-gray-500 uppercase font-semibold text-[10px]">Valid Until</p>
              <p className="font-medium text-gray-900">{membershipType === 'aajivan' ? 'Lifetime' : validUntil || 'N/A'}</p>
            </div>
          </div>

          {/* QR Code */}
          {qrCodeUrl && (
            <div className="flex flex-col items-center">
              <div className="p-1 bg-white border border-gray-200 rounded-lg shadow-sm">
                 <img src={qrCodeUrl} alt="Verify QR Code" className="w-16 h-16" />
              </div>
              <p className="text-[9px] text-gray-400 mt-1 uppercase font-semibold tracking-wider">Scan to Verify</p>
            </div>
          )}
        </div>

        {/* Footer Design Element */}
        <div className="h-2 w-full bg-gradient-to-r from-blue-700 via-indigo-500 to-blue-700"></div>
      </div>

      <button 
        onClick={handleDownload}
        className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors shadow-sm"
      >
        <Download className="w-4 h-4" /> 
        Download ID Card
      </button>

      {/* Hide elements when printing */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #id-card, #id-card * {
            visibility: visible;
          }
          #id-card {
            position: absolute;
            left: 50%;
            top: 5px;
            transform: translateX(-50%);
            box-shadow: none;
            border: 1px solid #ccc;
          }
        }
      `}</style>
    </div>
  );
}
