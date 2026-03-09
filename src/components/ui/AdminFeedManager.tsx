'use client';

import { useState, useTransition } from 'react';
import { Trash2, MessageSquare, ThumbsUp, User, Image as ImageIcon, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { adminDeletePost } from '@/app/actions/postActions';
import { toast } from 'react-hot-toast';

interface Post {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: Date | null;
  likesCount: number | null;
  authorName: string | null;
  authorRole: string | null;
  authorAvatar: string | null;
}

export default function AdminFeedManager({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (postId: string, previewText: string) => {
    if (!confirm(`Delete this post?\n\n"${previewText.slice(0, 80)}..."\n\nThis cannot be undone.`)) return;
    setDeletingId(postId);
    startTransition(async () => {
      const res = await adminDeletePost(postId);
      if (res.success) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        toast.success('Post deleted successfully.');
      } else {
        toast.error(res.message || 'Failed to delete post.');
      }
      setDeletingId(null);
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Social Feed Manager</h2>
        </div>
        <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
          {posts.length} posts
        </span>
      </div>

      {posts.length === 0 ? (
        <div className="p-12 text-center text-gray-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No posts in the feed yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {posts.map(post => (
            <div key={post.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group">
              
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 overflow-hidden border border-gray-200">
                {post.authorAvatar ? (
                  <img src={post.authorAvatar} alt={post.authorName || ''} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-blue-600" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900">{post.authorName}</span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">{post.authorRole}</span>
                  <span className="text-xs text-gray-400">
                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  </span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {post.likesCount ?? 0} likes</span>
                  {post.imageUrl && <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Has image</span>}
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => handleDelete(post.id, post.content)}
                disabled={isPending && deletingId === post.id}
                className="shrink-0 p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                title="Delete Post"
              >
                {isPending && deletingId === post.id ? (
                  <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
