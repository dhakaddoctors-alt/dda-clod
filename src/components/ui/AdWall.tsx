'use client';

import { useEffect, useState } from 'react';
import { fetchActiveAds } from '@/app/actions/adActions';
import { Megaphone, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

interface Ad {
  id: string;
  businessName: string;
  imageUrls: string; // JSON string
  linkUrl: string | null;
}

export default function AdWall() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAds() {
      const activeAds = await fetchActiveAds();
      setAds(activeAds as any);
      setLoading(false);
    }
    loadAds();
  }, []);

  if (loading) return null;
  if (ads.length === 0) return null;

  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center justify-between px-2">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-blue-600" />
          Sponsored Ads
        </h3>
        <span className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">DDA Partners</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ads.map((ad) => {
          const images = JSON.parse(ad.imageUrls) as {url: string, description: string}[];
          return (
            <div key={ad.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
              <div className="relative aspect-video bg-gray-100 overflow-hidden">
                <img 
                  src={images[0].url} 
                  alt={ad.businessName} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Image Description Overlay */}
                {images[0].description && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-10 translate-y-2 group-hover:translate-y-0 transition-transform">
                    <p className="text-white text-xs font-medium line-clamp-2">
                      {images[0].description}
                    </p>
                  </div>
                )}

                {images.length > 1 && (
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                    1/{images.length}
                  </div>
                )}
              </div>
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-gray-900 truncate">{ad.businessName}</h4>
                </div>
                {ad.linkUrl && (
                  <a 
                    href={ad.linkUrl} 
                    target="_blank" 
                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
