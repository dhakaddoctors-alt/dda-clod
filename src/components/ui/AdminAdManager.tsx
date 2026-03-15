'use client';

import { useState, useTransition } from 'react';
import { updateAdStatus, deleteAd } from '@/app/actions/adActions';
import { Check, X, Trash2, Eye, ExternalLink, Clock, Image as ImageIcon, Briefcase, Phone, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';

import ExportAdsPDFButton from './ExportAdsPDFButton';

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

export default function AdminAdManager({ initialAds }: { initialAds: Ad[] }) {
  const [ads, setAds] = useState<Ad[]>(initialAds);
  const [filter, setFilter] = useState('all');
  const [isPending, startTransition] = useTransition();

  const handleUpdateStatus = (id: string, newStatus: any) => {
    startTransition(async () => {
      const res = await updateAdStatus(id, newStatus);
      if (res.success) {
        setAds(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this ad request?')) return;
    startTransition(async () => {
      const res = await deleteAd(id);
      if (res.success) {
        setAds(prev => prev.filter(a => a.id !== id));
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  };

  const filteredAds = ads.filter(ad => filter === 'all' || ad.status === filter);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Advertisement Requests</h2>
          <p className="text-sm text-gray-500">Manage business ads and sponsorships.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ExportAdsPDFButton ads={filteredAds} />
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
            {['all', 'pending', 'approved', 'rejected'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter === s ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Business / Contact</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Creatives</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredAds.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">No advertisement requests found.</td>
              </tr>
            ) : (
              filteredAds.map(ad => {
                return (
                  <tr key={ad.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 font-bold text-gray-900 capitalize">
                          <Briefcase className="w-3.5 h-3.5 text-blue-500" /> {ad.businessName}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <UserIcon className="w-3.5 h-3.5 text-gray-400" /> {ad.contactPerson}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Phone className="w-3.5 h-3.5 text-gray-400" /> {ad.mobile}
                        </div>
                        {ad.linkUrl && (
                          <a href={ad.linkUrl} target="_blank" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                            <ExternalLink className="w-3 h-3" /> Visit Website
                          </a>
                        )}
                        <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                           <Clock className="w-3 h-3" /> {new Date(ad.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2 max-w-[200px]">
                        {(() => {
                          const raw = JSON.parse(ad.imageUrls);
                          const items = Array.isArray(raw) ? raw.map((item: any) => typeof item === 'string' ? { url: item, description: '' } : item) : [];
                          return items.map((img: any, i: number) => (
                            <div key={i} className="space-y-1">
                                <a href={img.url} target="_blank" className="relative block w-10 h-10 rounded-lg overflow-hidden border border-gray-200 group">
                                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <Eye className="w-3 h-3 text-white" />
                                    </div>
                                </a>
                                {img.description && (
                                    <p className="text-[10px] text-gray-500 italic leading-tight px-1 truncate w-10" title={img.description}>
                                        {img.description}
                                    </p>
                                )}
                            </div>
                          ));
                        })()}
                      </div>
                      <span className="text-[10px] text-gray-500 block mt-1">
                        {(() => {
                          const raw = JSON.parse(ad.imageUrls);
                          return Array.isArray(raw) ? raw.length : 0;
                        })()} images uploaded
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ad.status === 'approved' ? 'bg-green-100 text-green-700' :
                        ad.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {ad.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {ad.status !== 'approved' && (
                          <button 
                            onClick={() => handleUpdateStatus(ad.id, 'approved')}
                            className="bg-green-50 text-green-600 p-2 rounded-lg hover:bg-green-100 transition-colors"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {ad.status !== 'rejected' && (
                          <button 
                            onClick={() => handleUpdateStatus(ad.id, 'rejected')}
                            className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(ad.id)}
                          className="bg-gray-100 text-gray-400 p-2 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
