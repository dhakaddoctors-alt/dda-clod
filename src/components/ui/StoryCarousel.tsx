'use client';
import { Plus, Loader2 } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { fetchActiveStories, createStory } from '@/app/actions/storyActions';
import { useRouter } from 'next/navigation';
import { compressImageTo1MB } from '@/lib/imageCompression';

export default function StoryCarousel() {
  const [stories, setStories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    async function loadStories() {
      const data = await fetchActiveStories();
      setStories(data);
      setIsLoading(false);
    }
    loadStories();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Compress the story image down to 1MB before appending
    const compressedImage = await compressImageTo1MB(file);
    const formData = new FormData();
    formData.append('imageFile', compressedImage);

    startTransition(async () => {
      const res = await createStory(formData);
      if (res.success) {
        // Refresh the stories list
        const updated = await fetchActiveStories();
        setStories(updated);
        router.refresh();
      } else {
         alert(res.message);
      }
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex gap-3 overflow-x-auto custom-scrollbar">
      
      {/* Upload Own Story */}
      <div className="flex flex-col items-center gap-1 min-w-[72px] cursor-pointer group relative">
        <label className="relative rounded-full p-[2px] cursor-pointer">
           <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={isPending} />
           <div className="w-16 h-16 rounded-full bg-white p-[2px] border-2 border-dashed border-gray-300 group-hover:border-blue-500 transition-colors">
             <div className="w-full h-full rounded-full bg-gray-50 flex items-center justify-center overflow-hidden relative">
               {isPending ? (
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
        stories.map((story) => (
          <div key={story.id} className="flex flex-col items-center gap-1 min-w-[72px] cursor-pointer group">
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
    </div>
  );
}
