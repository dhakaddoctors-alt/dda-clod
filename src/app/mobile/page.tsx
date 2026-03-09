import MobileNavbar from '@/components/mobile/MobileNavbar';
import MobileTabBar from '@/components/shared/MobileTabBar';
import NewsSlider from '@/components/ui/NewsSlider';
import StoryCarousel from '@/components/ui/StoryCarousel';
import PostCard from '@/components/ui/PostCard';
import CreatePostModal from '@/components/ui/CreatePostModal';
import { fetchFeedPosts } from '@/app/actions/postActions';
import { fetchAllNews } from '@/app/actions/newsActions';
import GuestHeroBanner from '@/components/ui/GuestHeroBanner';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export default async function MobileHome() {
  const feedPosts = await fetchFeedPosts();
  const allNews = await fetchAllNews();
  const activeNews = allNews.filter(n => n.isActive === 1);

  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16">
      <MobileNavbar />
      
      <main className="flex-1 p-4 w-full pt-20">
        {!isAuthenticated && <GuestHeroBanner />}
        
        {/* Mobile Header Title */}
        <h2 className="text-xl font-bold text-gray-900 mb-4 px-2">Community Feed</h2>
        
        {/* Dynamic Feature: News Slider */}
        <div className="mb-6">
          <NewsSlider news={activeNews} />
        </div>
        
        {/* Facebook-style Stories */}
        <div className="mb-6">
          <StoryCarousel />
        </div>

        {/* Create Post Action */}
        <CreatePostModal />

        {/* Facebook-style Feed */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
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
      </main>
      
      {/* 
        The MobileTabBar is currently in the root layout, 
        but in a fully split architecture, we might move it exclusively here.
        For now, we rely on the root layout providing it.
      */}
    </div>
  );
}
