'use client';
import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';

interface PostProps {
  authorName: string;
  role: string;
  avatarUrl?: string;
  timeAgo: string;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
}

export default function PostCard({ authorName, role, avatarUrl, timeAgo, content, imageUrl, likes, comments }: PostProps) {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={authorName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-blue-600 font-bold">{authorName.charAt(0)}</span>
            )}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 leading-tight">{authorName}</h4>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span className="font-medium">{role}</span>
              <span>•</span>
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-2">
        <p className="text-gray-800 whitespace-pre-line text-sm md:text-base">{content}</p>
      </div>

      {/* Post Image (Optional) */}
      {imageUrl && (
        <div className="w-full h-auto max-h-[500px] overflow-hidden bg-gray-100 mt-2">
          <img src={imageUrl} alt="Post content" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Post Stats */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="bg-blue-600 rounded-full p-1 flex items-center justify-center">
            <Heart className="w-3 h-3 text-white fill-white" />
          </div>
          <span>{isLiked ? likes + 1 : likes} Likes</span>
        </div>
        <div>
          <span>{comments} Comments</span>
        </div>
      </div>

      {/* Post Actions */}
      <div className="px-2 py-1 flex items-center justify-between gap-1">
        <button 
          onClick={() => setIsLiked(!isLiked)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-sm transition-colors ${
            isLiked ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-blue-600' : ''}`} />
          Like
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-600 font-medium text-sm hover:bg-gray-100 transition-colors">
          <MessageCircle className="w-5 h-5" />
          Comment
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-600 font-medium text-sm hover:bg-gray-100 transition-colors">
          <Share2 className="w-5 h-5" />
          Share
        </button>
      </div>
    </div>
  );
}
