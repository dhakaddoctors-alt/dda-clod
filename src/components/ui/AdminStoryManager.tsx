'use client';

import { useState, useTransition } from 'react';
import { Trash2, User, Image as ImageIcon, CheckCircle2, XCircle } from 'lucide-react';
import { adminDeleteStory } from '@/app/actions/storyActions';
import { toast } from 'react-hot-toast';

interface Story {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: Date | null;
  expiresAt: Date | null;
  authorName: string | null;
  authorRole: string | null;
  authorAvatar: string | null;
}

export default function AdminStoryManager({ initialStories }: { initialStories: Story[] }) {
  const [storiesList, setStoriesList] = useState(initialStories);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (storyId: string) => {
    if (!confirm(`Delete this story?\n\nThis cannot be undone.`)) return;
    setDeletingId(storyId);
    startTransition(async () => {
      const res = await adminDeleteStory(storyId);
      if (res.success) {
        setStoriesList(prev => prev.filter(s => s.id !== storyId));
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
      setDeletingId(null);
    });
  };

  const now = new Date();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-gray-900">Story Manager</h2>
        </div>
        <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
          {storiesList.length} stories
        </span>
      </div>

      {storiesList.length === 0 ? (
        <div className="p-12 text-center text-gray-400">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No stories posted yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {storiesList.map(story => {
             const isExpired = story.expiresAt && new Date(story.expiresAt) < now;
             
             return (
               <div key={story.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group">
                 
                 {/* Story Image Thumbnail */}
                 <div className="w-12 h-16 rounded-xl bg-gray-100 shrink-0 overflow-hidden border border-gray-200 relative">
                   <img src={story.imageUrl} alt="Story" className="w-full h-full object-cover" />
                 </div>

                 {/* Author Info */}
                 <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden border border-gray-200">
                   {story.authorAvatar ? (
                     <img src={story.authorAvatar} alt={story.authorName || ''} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full bg-indigo-100 flex items-center justify-center">
                       <User className="w-5 h-5 text-indigo-600" />
                     </div>
                   )}
                 </div>

                 {/* Content */}
                 <div className="flex-1 min-w-0">
                   <div className="flex flex-wrap items-center gap-2 mb-1">
                     <span className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">{story.authorName}</span>
                     <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">{story.authorRole}</span>
                     
                     {/* Status Badge */}
                     {isExpired ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                           <XCircle className="w-3 h-3" /> Expired
                        </span>
                     ) : (
                        <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                           <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                     )}
                   </div>
                   
                   {story.caption ? (
                      <p className="text-sm text-gray-700 line-clamp-1">"{story.caption}"</p>
                   ) : (
                      <p className="text-sm text-gray-400 italic">No caption</p>
                   )}
                   
                   <p className="text-xs text-gray-400 mt-1">
                      Posted: {story.createdAt ? new Date(story.createdAt).toLocaleString('en-IN') : ''}
                   </p>
                 </div>

                 {/* Delete Button */}
                 <button
                   onClick={() => handleDelete(story.id)}
                   disabled={isPending && deletingId === story.id}
                   className="shrink-0 p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                   title="Delete Story"
                 >
                   {isPending && deletingId === story.id ? (
                     <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block" />
                   ) : (
                     <Trash2 className="w-4 h-4" />
                   )}
                 </button>

               </div>
             );
          })}
        </div>
      )}
    </div>
  );
}
