'use client';

import { useState, useRef } from 'react';
import { Image as ImageIcon, Loader2, Download } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

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

export default function ExportAdsImageButton({ ad, variant = 'full' }: { ad: Ad, variant?: 'full' | 'icon' }) {
  const [isPending, setIsPending] = useState(false);
  const hiddenCardRef = useRef<HTMLDivElement>(null);

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPending(true);
    console.log('[JPG] Starting export, htmlToImage type:', typeof htmlToImage);
    
    try {
      if (!hiddenCardRef.current) throw new Error('Export element not found');

      // Use html-to-image via namespace to be safer with bundling
      if (typeof htmlToImage.toJpeg !== 'function') {
        throw new Error('toJpeg is not a function in html-to-image');
      }

      const dataUrl = await htmlToImage.toJpeg(hiddenCardRef.current, { 
        quality: 0.95,
        cacheBust: true,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `Ad_${ad.businessName.replace(/\s+/g, '_')}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Image Export Error:', error);
      alert('Failed to generate JPG image. Please try again.');
    } finally {
      setIsPending(false);
    }
  };

  const images = JSON.parse(ad.imageUrls);
  const mainImageRaw = Array.isArray(images) && images.length > 0 ? (typeof images[0] === 'string' ? images[0] : images[0].url) : null;
  // Use proxy to avoid CORS issues
  const mainImage = mainImageRaw ? `/api/proxy-image?url=${encodeURIComponent(mainImageRaw)}` : null;

  return (
    <>
      <button
        onClick={handleExport}
        disabled={isPending}
        className={variant === 'icon' 
          ? "bg-orange-50 text-orange-600 p-2 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50"
          : "flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 disabled:bg-gray-300"
        }
        title="Download JPG"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
        {variant === 'full' && 'Export JPG'}
      </button>

      {/* Hidden card with SAFE COLORS for html2canvas compatibility */}
      <div className="fixed -left-[1000vw] top-0">
        <div 
          ref={hiddenCardRef}
          className="w-[600px] p-10 flex flex-col gap-8"
          style={{ backgroundColor: '#ffffff', fontFamily: 'sans-serif' }}
        >
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-black capitalize mb-2" style={{ color: '#111827' }}>{ad.businessName}</h1>
              <p className="text-xl font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: '#2563eb' }}>
                <Download className="w-5 h-5" /> Advertisement Request
              </p>
            </div>
            <div className="px-6 py-2 rounded-full text-sm font-black uppercase" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>
              {ad.status}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 p-8 rounded-3xl border" style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}>
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Client Contact</p>
              <div className="space-y-2">
                <p className="text-2xl font-bold" style={{ color: '#111827' }}>{ad.contactPerson}</p>
                <p className="text-xl" style={{ color: '#4b5563' }}>{ad.mobile}</p>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Submission Details</p>
              <div className="space-y-2">
                <p className="text-lg font-bold" style={{ color: '#111827' }}>Submitted: {new Date(ad.createdAt).toLocaleDateString()}</p>
                <p className="text-sm" style={{ color: '#2563eb' }}>{ad.linkUrl || 'No Website Linked'}</p>
              </div>
            </div>
          </div>

          {mainImage && (
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Primary Creative Preview</p>
              <div className="relative aspect-video rounded-3xl overflow-hidden border shadow-lg" style={{ borderColor: '#e5e7eb' }}>
                <img src={mainImage} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          <div className="border-t pt-8 flex justify-between items-center opacity-40" style={{ borderTopColor: '#f3f4f6' }}>
            <p className="text-xs font-medium italic" style={{ color: '#6b7280' }}>DDA Portal • System Generated Advertisement Summary</p>
            <p className="text-[10px] font-mono">{ad.id}</p>
          </div>
        </div>
      </div>
    </>
  );
}
