import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import NewsSlider from '@/components/ui/NewsSlider';
import CommitteeMarquee from '@/components/ui/CommitteeMarquee';
import StoryCarousel from '@/components/ui/StoryCarousel';
import PostCard from '@/components/ui/PostCard';
import CreatePostModal from '@/components/ui/CreatePostModal';
// Removed import { db } from '@/db/schema'
import { fetchFeedPosts } from '@/app/actions/postActions';

export default async function Home() {
  const feedPosts = await fetchFeedPosts();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex flex-1 pt-16">
        <Sidebar />
        
        {/* Main Feed Content area */}
        <main className="flex-1 lg:ml-64 p-4 lg:p-8 max-w-4xl mx-auto w-full">
          {/* Dynamic Feature: News Slider */}
          <NewsSlider />
          
          {/* Dynamic Feature: Committee Marquee */}
          <CommitteeMarquee />

            <div className="mt-8">
            {/* Facebook-style Stories */}
            <StoryCarousel />

            {/* AI Moderated Create Post Modal */}
            <CreatePostModal />

            {/* Facebook-style Feed */}
            <div className="space-y-4 pb-20">
              <h3 className="font-bold text-gray-800 mb-2">Recent Updates</h3>
              {feedPosts.length === 0 ? (
                 <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-400">
                    No posts yet. Be the first to share an update!
                 </div>
              ) : (
                feedPosts.map(post => (
                  <PostCard 
                    key={post.id}
                    id={post.id}
                    authorName={post.authorName}
                    role={post.authorRole}
                    avatarUrl={post.authorAvatar || undefined}
                    timeAgo={new Date(post.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    content={post.content || ''}
                    imageUrl={post.imageUrl || undefined}
                    likes={post.likesCount || 0}
                    hasLiked={post.hasLiked}
                    commentsList={post.commentsList}
                  />
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
