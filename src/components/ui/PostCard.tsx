'use client';
import { useState, useTransition } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical, Send, Loader2, Trash2 } from 'lucide-react';
import { toggleLike, addComment, deletePost } from '@/app/actions/postActions';

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  authorName: string;
  authorAvatar: string | null;
}

interface PostProps {
  id: string;
  authorName: string;
  role: string;
  avatarUrl?: string;
  timeAgo: string;
  content: string;
  imageUrl?: string;
  likes: number;
  hasLiked: boolean;
  commentsList: Comment[];
  isOwner?: boolean;
}

export default function PostCard({ 
  id, authorName, role, avatarUrl, timeAgo, content, imageUrl, likes, hasLiked, commentsList, isOwner 
}: PostProps) {
  const [isLikedOptimistic, setIsLikedOptimistic] = useState(hasLiked);
  const [likesCountOptimistic, setLikesCountOptimistic] = useState(likes);
  const [isPending, startTransition] = useTransition();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, startCommentTransition] = useTransition();
  const [localComments, setLocalComments] = useState(commentsList);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleLike = () => {
    // Optimistic UI update
    const previousState = isLikedOptimistic;
    setIsLikedOptimistic(!previousState);
    setLikesCountOptimistic(prev => previousState ? Math.max(0, prev - 1) : prev + 1);

    startTransition(async () => {
      const res = await toggleLike(id);
      if (!res.success) {
        // Revert on failure
        setIsLikedOptimistic(previousState);
        setLikesCountOptimistic(prev => previousState ? prev + 1 : Math.max(0, prev - 1));
      }
    });
  };

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    
    // Optimistic addition
    const tempComment: Comment = {
      id: 'temp-' + Date.now(),
      content: commentText,
      createdAt: new Date(),
      authorName: 'You',
      authorAvatar: null,
    };
    
    setLocalComments([tempComment, ...localComments]);
    const submittedText = commentText;
    setCommentText('');
    
    startCommentTransition(async () => {
      const res = await addComment(id, submittedText);
      if (!res.success) {
        // revert on failure
        setLocalComments(localComments);
        setCommentText(submittedText);
        alert(res.message);
      }
    });
  };

  const handleDeletePost = () => {
    if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) return;
    setIsDeleting(true);
    startTransition(async () => {
      const res = await deletePost(id);
      if (!res.success) {
        alert(res.message);
        setIsDeleting(false);
      }
    });
  };

  if (isDeleting) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={authorName} className="w-full h-full object-cover object-top" />
            ) : (
              <span className="text-blue-600 font-bold">{authorName.charAt(0)}</span>
            )}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 leading-tight">{authorName}</h4>
            <div className="flex items-center gap-1 text-xs text-gray-500 pt-0.5">
              {/* Role display removed */}
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>
        {isOwner && (
          <div className="relative group">
            <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 shadow-lg rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 w-32 overflow-hidden">
               <button 
                 onClick={handleDeletePost}
                 className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
               >
                 <Trash2 className="w-4 h-4" /> Delete
               </button>
            </div>
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="px-4 pb-2">
        <p className="text-gray-800 whitespace-pre-line text-sm md:text-base">{content}</p>
      </div>

      {/* Post Image (Optional) */}
      {imageUrl && (
        <div className="w-full h-auto max-h-[500px] overflow-hidden bg-gray-100 mt-2">
          <img src={imageUrl} alt="Post content" className="w-full h-full object-cover object-top" />
        </div>
      )}

      {/* Post Stats */}
      <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="bg-blue-600 rounded-full p-1 flex items-center justify-center">
            <Heart className="w-3 h-3 text-white fill-white" />
          </div>
          <span className="select-none">{likesCountOptimistic} Likes</span>
        </div>
        <div>
          <span className="select-none cursor-pointer hover:underline" onClick={() => setShowComments(!showComments)}>
            {localComments.length} Comments
          </span>
        </div>
      </div>

      <div className="border-t border-gray-100"></div>

      {/* Post Actions */}
      <div className="px-2 py-1 flex items-center justify-between gap-1">
        <button 
          onClick={handleToggleLike}
          disabled={isPending}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-sm transition-colors ${
            isLikedOptimistic ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Heart className={`w-5 h-5 ${isLikedOptimistic ? 'fill-blue-600' : ''}`} />
          {isLikedOptimistic ? 'Liked' : 'Like'}
        </button>
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-600 font-medium text-sm hover:bg-gray-100 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          Comment
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-600 font-medium text-sm hover:bg-gray-100 transition-colors">
          <Share2 className="w-5 h-5" />
          Share
        </button>
      </div>

      {/* Comments Drawer */}
      {showComments && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50">
          
          <div className="space-y-4 mb-4">
            {localComments.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-2">No comments yet. Be the first to start the discussion!</p>
            ) : (
              localComments.map(comment => (
                <div key={comment.id} className="flex gap-2">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-blue-100 flex flex-col items-center justify-center overflow-hidden">
                    {comment.authorAvatar ? (
                      <img src={comment.authorAvatar} alt="" className="w-full h-full object-cover object-top" />
                    ) : (
                      <span className="text-blue-600 font-bold text-xs">{comment.authorName.charAt(0)}</span>
                    )}
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-3 py-2 w-full">
                     <p className="text-xs font-bold text-gray-900">{comment.authorName}</p>
                     <p className="text-sm text-gray-700 mt-0.5">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center gap-2 relative">
             <input 
               type="text" 
               placeholder="Write a comment..." 
               value={commentText}
               onChange={(e) => setCommentText(e.target.value)}
               disabled={isCommenting}
               onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
               className="w-full bg-white border border-gray-300 rounded-full pl-4 pr-10 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
             />
             <button 
               onClick={handlePostComment}
               disabled={isCommenting || !commentText.trim()}
               className="absolute right-2 text-blue-600 disabled:text-gray-400 p-1 hover:bg-blue-50 rounded-full"
             >
                {isCommenting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
             </button>
          </div>

        </div>
      )}

    </div>
  );
}
