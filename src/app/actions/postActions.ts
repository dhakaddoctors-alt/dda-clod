'use server';

import { posts, comments, profiles, postLikes } from '@/db/schema';
import { randomUUID } from 'crypto';
import { eq, desc, and, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { uploadToSocialR2 } from '@/lib/storage';
import { analyzePostContent } from '@/app/actions/aiActions';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { unstable_cache, revalidateTag, revalidatePath } from 'next/cache';

const getRawFeedFromDB = async () => {
  const db = getDb();
  return await db.select({
    id: posts.id,
    content: posts.content,
    imageUrl: posts.imageUrl,
    createdAt: posts.createdAt,
    likesCount: posts.likesCount,
    authorId: posts.authorId,
    authorName: profiles.fullName,
    authorRole: profiles.role,
    authorAvatar: profiles.avatarUrl,
  })
  .from(posts)
  .innerJoin(profiles, eq(posts.authorId, profiles.id))
  .orderBy(desc(posts.createdAt))
  .limit(20);
};

// Cache the raw global feed, refreshed every 5 min or manually on new post
const getCachedRawFeed = unstable_cache(
  getRawFeedFromDB,
  ['feed-posts'],
  { tags: ['feed'], revalidate: 300 } 
);

export async function fetchFeedPosts() {
  try {
    const db = getDb();
    const session = await getServerSession(authOptions) as any;
    const currentUserId = session?.user?.id;

    // Fetch the globally cached raw feed (No DB hit if cached)
    const feed = await getCachedRawFeed();

    // Fetch comments and like status for each post
    const expandedFeed = await Promise.all(feed.map(async (post) => {
       // 1. Check if liked by current user
       let hasLiked = false;
       if (currentUserId) {
         const userLike = await db.select().from(postLikes).where(
           and(eq(postLikes.postId, post.id), eq(postLikes.profileId, currentUserId))
         ).limit(1);
         if (userLike.length > 0) hasLiked = true;
       }

       // 2. Fetch comments for this post
       const postComments = await db.select({
          id: comments.id,
          content: comments.content,
          createdAt: comments.createdAt,
          authorName: profiles.fullName,
          authorAvatar: profiles.avatarUrl,
       })
       .from(comments)
       .innerJoin(profiles, eq(comments.authorId, profiles.id))
       .where(eq(comments.postId, post.id))
       .orderBy(desc(comments.createdAt))
       .limit(5); // Show latest 5 comments

       return {
         ...post,
         hasLiked,
         commentsList: postComments
       };
    }));

    return expandedFeed;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

export async function createPost(formData: FormData) {
  try {
    const content = formData.get('content') as string;
    if (!content) throw new Error('Post content cannot be empty');
    
    // AI Moderation Step
    const moderationResult = await analyzePostContent(content);
    if (!moderationResult.isSafe) {
       throw new Error(`Content Blocked: ${moderationResult.flagReason}`);
    }
    
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.id) throw new Error("Unauthorized");
    const authorId = session.user.id;

    // Process R2 Image Uploads for the newsfeed
    let imageUrl = null;
    const imageFile = formData.get('imageFile') as File | null;
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadToSocialR2(imageFile);
    }

    const newPost = {
      id: randomUUID(),
      authorId,
      content,
      imageUrl: imageUrl || (formData.get('imageUrl') as string || null),
      createdAt: new Date(),
      likesCount: 0
    };

    console.log('Inserting new post into DB:', newPost);
    const db = getDb();
    await db.insert(posts).values(newPost);
    
    // Invalidate the globally cached feed
    revalidatePath('/'); // refresh homepage

    return { success: true, message: 'Posted successfully' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to create post' };
  }
}

export async function toggleLike(postId: string) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };
    const currentUserId = session.user.id;

    const db = getDb();
    
    // Check if like exists
    const existing = await db.select().from(postLikes).where(
       and(eq(postLikes.postId, postId), eq(postLikes.profileId, currentUserId))
    ).limit(1);

    if (existing.length > 0) {
       // User already liked it, so Unlike
       await db.delete(postLikes).where(eq(postLikes.id, existing[0].id));
       // decrement counter manually
       await db.run(sql`UPDATE posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ${postId}`);
    } else {
       // Add Like
       await db.insert(postLikes).values({
         id: randomUUID(),
         postId,
         profileId: currentUserId,
         createdAt: new Date()
       });
       // increment counter
       await db.run(sql`UPDATE posts SET likes_count = likes_count + 1 WHERE id = ${postId}`);
    }
    
    revalidatePath('/');
    return { success: true };
  } catch(err: any) {
    console.error('Like toggle error', err);
    return { success: false, message: 'Internal Server Error' };
  }
}

export async function addComment(postId: string, content: string) {
  try {
    if (!content || content.trim() === '') return { success: false, message: "Comment cannot be empty" };

    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };
    
    // Optional AI Moderation on comments:
    const moderationResult = await analyzePostContent(content);
    if (!moderationResult.isSafe) {
       return { success: false, message: `Blocked: ${moderationResult.flagReason}` };
    }

    const db = getDb();
    await db.insert(comments).values({
      id: randomUUID(),
      postId,
      authorId: session.user.id,
      content,
      createdAt: new Date()
    });
    
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error('Add comment error', err);
    return { success: false, message: 'Failed to post comment' };
  }
}
