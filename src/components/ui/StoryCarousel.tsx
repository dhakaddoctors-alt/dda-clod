'use client';
import { Plus, Loader2, X } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { fetchActiveStories, createStory } from '@/app/actions/storyActions';
import { useRouter } from 'next/navigation';
import { compressImageTo1MB } from '@/lib/imageCompression';

export default function StoryCarousel() {
  const [stories, setStories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);

  // New state for Story Creation Modal
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  
  const router = useRouter();

  useEffect(() => {
    async function loadStories() {
      const data = await fetchActiveStories();
      setStories(data);
      setIsLoading(false);
    }
    loadStories();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Store file and create a preview URL
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setCaption(''); // Reset caption
    // Clear the input value so the same file can be selected again
    e.target.value = '';
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Compress the story image down to 1MB before appending
      const compressedImage = await compressImageTo1MB(selectedFile);
      const formData = new FormData();
      formData.append('imageFile', compressedImage);
      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }

      const res = await createStory(formData);
      if (res.success) {
        // Refresh the stories list
        const updated = await fetchActiveStories();
        setStories(updated);
        router.refresh();
        // Close modal
        setSelectedFile(null);
        setPreviewUrl(null);
      } else {
         alert(res.message);
      }
    } catch (error: any) {
      alert("Error uploading story. Please try again.");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex gap-3 overflow-x-auto custom-scrollbar snap-x snap-mandatory pb-4">      
      {/* Upload Own Story */}
      <div className="flex flex-col items-center gap-1 min-w-[72px] cursor-pointer group relative snap-start">
        <label className="relative rounded-full p-[2px] cursor-pointer">
           <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} disabled={isUploading} />
           <div className="w-16 h-16 rounded-full bg-white p-[2px] border-2 border-dashed border-gray-300 group-hover:border-blue-500 transition-colors">
             <div className="w-full h-full rounded-full bg-gray-50 flex items-center justify-center overflow-hidden relative">
               {isUploading ? (
                 <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
               ) : (
                 <Plus className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
               )}
             </div>
           </div>
        </label>
        <span className="text-xs font-medium text-gray-700 truncate w-16 text-center">Add Story</span>
      </div>

      {isLoading ? (
         <div className="flex items-center justify-center flex-1">
           <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
         </div>
      ) : (
        stories.map((story, index) => (
          <div 
            key={story.id} 
            onClick={() => setViewingStoryIndex(index)}
            className="flex flex-col items-center gap-1 min-w-[72px] cursor-pointer group snap-start"
          >
            <div className={`relative rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 to-blue-600`}>
              <div className="w-16 h-16 rounded-full bg-white p-[2px]">
                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  <img src={story.authorAvatar || story.imageUrl} alt={story.authorName} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
            <span className="text-xs font-medium text-gray-700 truncate w-16 text-center">
              {story.authorName}
            </span>
          </div>
        ))
      )}

      {/* Story Viewer Modal */}
      {viewingStoryIndex !== null && stories[viewingStoryIndex] && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center animate-in fade-in duration-200">
           {/* Progress Bar (Static placeholder) */}
           <div className="absolute top-0 left-0 w-full h-1 bg-gray-800 z-[101]">
             <div className="h-full bg-white/50 w-full"></div>
           </div>

           {/* Header */}
           <div className="absolute top-4 w-full px-4 flex justify-between items-center z-[102] pt-[env(safe-area-inset-top)]">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-white/20">
                 <img src={stories[viewingStoryIndex].authorAvatar || stories[viewingStoryIndex].imageUrl} alt="Avatar" className="w-full h-full object-cover" />
               </div>
               <span className="text-white font-medium drop-shadow-md">
                 {stories[viewingStoryIndex].authorName}
               </span>
             </div>
             <button 
               onClick={() => setViewingStoryIndex(null)}
               className="p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors backdrop-blur-sm"
             >
               <X className="w-6 h-6" />
             </button>
           </div>
           
           {/* Story Image */}
           <img 
             src={stories[viewingStoryIndex].imageUrl} 
             alt="Story" 
             className="w-full h-screen object-cover sm:object-contain relative z-[100]" 
           />

           {/* Caption Overlay */}
           {stories[viewingStoryIndex].caption && (
             <div className="absolute bottom-0 w-full p-6 pt-20 bg-gradient-to-t from-black/90 to-transparent z-[102] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
               <p className="text-white text-lg font-medium drop-shadow-md text-center px-4">
                 {stories[viewingStoryIndex].caption}
               </p>
             </div>
           )}

           {/* Navigation Overlays */}
           <div className="absolute inset-0 z-[103] flex pt-20">
             <div 
               className="w-1/2 h-full cursor-pointer" 
               onClick={(e) => {
                 e.stopPropagation();
                 setViewingStoryIndex(prev => prev! > 0 ? prev! - 1 : prev);
               }}
             />
             <div 
               className="w-1/2 h-full cursor-pointer" 
               onClick={(e) => {
                 e.stopPropagation();
                 setViewingStoryIndex(prev => prev! < stories.length - 1 ? prev! + 1 : null);
               }}
             />
           </div>
        </div>
      )}

      {/* Create Story Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black z-[110] flex flex-col items-center justify-center animate-in fade-in duration-200">
           {/* Header */}
           <div className="absolute top-4 w-full px-4 flex justify-between items-center z-[112] pt-[env(safe-area-inset-top)]">
             <span className="text-white font-medium drop-shadow-md text-lg">
               New Story
             </span>
             <button 
               onClick={() => {
                 setSelectedFile(null);
                 setPreviewUrl(null);
               }}
               disabled={isUploading}
               className="p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors backdrop-blur-sm disabled:opacity-50"
             >
               <X className="w-6 h-6" />
             </button>
           </div>
           
           {/* Story Image Preview */}
           <img 
             src={previewUrl} 
             alt="Preview" 
             className="w-full h-screen object-cover sm:object-contain opacity-90" 
           />

           {/* Caption Input and Upload Button */}
           <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black/90 to-transparent flex gap-2 items-center pb-[calc(env(safe-area-inset-bottom)+1rem)]">
             <input
               type="text"
               placeholder="Add a caption..."
               value={caption}
               onChange={(e) => setCaption(e.target.value)}
               disabled={isUploading}
               className="flex-1 bg-white/20 text-white placeholder-white/70 border border-white/30 rounded-full py-3 px-5 focus:outline-none focus:bg-white/30 backdrop-blur-sm"
               autoFocus
             />
             <button
               onClick={handleConfirmUpload}
               disabled={isUploading}
               className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full flex items-center justify-center transition-colors disabled:opacity-75 disabled:cursor-not-allowed shrink-0 shadow-lg"
             >
               {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
             </button>
           </div>
        </div>
      )}

    </div>
  );
}
