'use client';
import { useState, useTransition } from 'react';
import { createPost } from '@/app/actions/postActions';
import { ImagePlus, X, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { compressImageTo1MB } from '@/lib/imageCompression';

export default function CreatePostModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const router = useRouter();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError('');

    // Pre-compress the image to 1MB limit before server upload
    const imageFile = formData.get('imageFile') as File;
    if (imageFile && imageFile.size > 0 && imageFile.type.startsWith('image/')) {
      const compressedImage = await compressImageTo1MB(imageFile);
      formData.set('imageFile', compressedImage);
    }

    startTransition(async () => {
      const res = await createPost(formData);
      if (res.success) {
        setIsOpen(false);
        setPreviewUrl(null);
        router.refresh(); // Refresh feed immediately
      } else {
        setError(res.message);
      }
    });
  };

  return (
    <>
      {/* Trigger Box */}
      <div 
         onClick={() => setIsOpen(true)}
         className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex gap-3 items-center cursor-pointer hover:bg-gray-50 transition"
      >
         <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
           <span className="text-blue-600 font-bold">U</span>
         </div>
         <div className="bg-gray-100 rounded-full h-10 flex-1 flex items-center px-4 text-gray-500">
           What's on your mind? Share an update or image...
         </div>
      </div>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-900">Create Post</h3>
              <button onClick={() => { setIsOpen(false); setError(''); }} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
              <div className="p-6">
                
                {/* AI Block Error */}
                {error && (
                   <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 items-start">
                     <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                     <p className="text-sm font-medium text-red-800">{error}</p>
                   </div>
                )}

                <div className="flex gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-blue-600 font-bold">U</span>
                  </div>
                  <div className="flex flex-col">
                     <span className="font-bold text-gray-900 text-sm">Your Name</span>
                     <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full w-fit capitalize font-medium">Public</span>
                  </div>
                </div>

                <textarea 
                  name="content"
                  required
                  rows={4}
                  placeholder="What do you want to share with the community?"
                  className="w-full resize-none border-none focus:ring-0 p-0 text-lg text-gray-800 placeholder-gray-400"
                  autoFocus
                />

                {previewUrl && (
                  <div className="mt-4 relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img src={previewUrl} alt="Upload preview" className="w-full max-h-64 object-contain" />
                    <button 
                      type="button" 
                      onClick={() => setPreviewUrl(null)} 
                      className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-md transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4 mt-auto">
                <div>
                   <label className="flex items-center gap-2 px-4 py-2 hover:bg-gray-200 text-gray-700 rounded-xl cursor-pointer transition font-medium text-sm">
                     <ImagePlus className="w-5 h-5 text-green-600" />
                     Photo
                     <input 
                       type="file" 
                       name="imageFile" 
                       accept="image/*" 
                       className="hidden" 
                       onChange={handleImageChange}
                     />
                   </label>
                </div>
                
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
}
