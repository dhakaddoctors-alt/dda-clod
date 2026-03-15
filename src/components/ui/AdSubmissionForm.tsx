'use client';

import { useState, useTransition } from 'react';
import { Upload, X, CheckCircle2, Loader2, Image as ImageIcon, Plus } from 'lucide-react';
import { uploadToSocialR2 } from '@/lib/storage';
import { submitAdRequest } from '@/app/actions/adActions';
import toast from 'react-hot-toast';

export default function AdSubmissionForm() {
  const [isPending, startTransition] = useTransition();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    businessName: '',
    contactPerson: '',
    mobile: '',
    linkUrl: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
      
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previews[index]);
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      toast.error('Please upload at least one image/file for your ad.');
      return;
    }

    startTransition(async () => {
      try {
        // 1. Upload all files to R2
        const uploadPromises = files.map(file => uploadToSocialR2(file));
        const imageUrls = await Promise.all(uploadPromises);
        
        const filteredUrls = imageUrls.filter(url => url !== '');
        if (filteredUrls.length === 0) {
          throw new Error('Failed to upload files. Please try again.');
        }

        // 2. Submit data to DB
        const res = await submitAdRequest({
          ...formData,
          imageUrls: filteredUrls,
        });

        if (res.success) {
          toast.success(res.message);
          // Reset form
          setFiles([]);
          setPreviews([]);
          setFormData({
            businessName: '',
            contactPerson: '',
            mobile: '',
            linkUrl: '',
          });
        } else {
          toast.error(res.message);
        }
      } catch (error: any) {
        toast.error(error.message || 'Something went wrong.');
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Submit Advertisement</h2>
        <p className="text-gray-500">Provide your business details and upload your ad creative. Admins will review before publishing.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Business Name *</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Acme Clinics"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.businessName}
              onChange={e => setFormData({...formData, businessName: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Person *</label>
            <input 
              required
              type="text" 
              placeholder="Full Name"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.contactPerson}
              onChange={e => setFormData({...formData, contactPerson: e.target.value})}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile Number *</label>
            <input 
              required
              type="tel" 
              placeholder="10-digit mobile"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.mobile}
              onChange={e => setFormData({...formData, mobile: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Target Link (Optional)</label>
            <input 
              type="url" 
              placeholder="https://your-website.com"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.linkUrl}
              onChange={e => setFormData({...formData, linkUrl: e.target.value})}
            />
          </div>
        </div>

        {/* Multi-File Upload Section */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Ad Imagery (Multiple allowed) *</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {previews.map((preview, index) => (
              <div key={index} className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 group">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  type="button" 
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <label className="cursor-pointer aspect-video rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-all text-gray-400 hover:text-blue-500">
              <input type="file" multiple accept="image/*,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
              <Plus className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium uppercase">Add Photo</span>
            </label>
          </div>
          <p className="mt-2 text-xs text-gray-500 italic">Supports JPG, PNG and other imagery formats.</p>
        </div>

        <button 
          type="submit" 
          disabled={isPending}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:bg-gray-400"
        >
          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
          {isPending ? 'Submitting...' : 'Submit Ad Request'}
        </button>
      </form>
    </div>
  );
}
