'use server';

import { posts, comments, profiles } from '@/db/schema';
import { randomUUID } from 'crypto';
import { eq, desc } from 'drizzle-orm';
import { getDb } from '@/db';
import { uploadToSocialR2 } from '@/lib/storage';
import { analyzePostContent } from '@/app/actions/aiActions';

export async function fetchFeedPosts() {
  try {
    const db = getDb();
    const feed = await db.select({
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
    return feed;
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
    
    // In actual implementation, fetch logged in user from session
    // const session = await getServerSession(authOptions);
    // const authorId = session.user.id;
    const authorId = 'test_user_id'; // Mock ID

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

    return { success: true, message: 'Posted successfully' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to create post' };
  }
}
