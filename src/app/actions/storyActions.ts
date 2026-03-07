'use server';

import { stories, profiles } from '@/db/schema';
import { randomUUID } from 'crypto';
import { desc, eq, gt } from 'drizzle-orm';
import { getDb } from '@/db';
import { uploadToSocialR2 } from '@/lib/storage';

export async function fetchActiveStories() {
  try {
    const db = getDb();
    const now = new Date();

    const activeStories = await db.select({
      id: stories.id,
      imageUrl: stories.imageUrl,
      createdAt: stories.createdAt,
      expiresAt: stories.expiresAt,
      authorId: stories.authorId,
      authorName: profiles.fullName,
      authorAvatar: profiles.avatarUrl,
    })
    .from(stories)
    .innerJoin(profiles, eq(stories.authorId, profiles.id))
    .where(gt(stories.expiresAt, now))
    .orderBy(desc(stories.createdAt))
    .limit(30);

    return activeStories;
  } catch (error) {
    console.error('Error fetching active stories:', error);
    return [];
  }
}

export async function createStory(formData: FormData) {
  try {
    // In actual implementation, fetch logged in user from session
    // const session = await getServerSession(authOptions);
    // const authorId = session.user.id;
    const authorId = 'test_user_id'; // Mock ID

    const imageFile = formData.get('imageFile') as File | null;
    if (!imageFile || imageFile.size === 0) {
       throw new Error('An image must be uploaded for a Story');
    }

    const imageUrl = await uploadToSocialR2(imageFile);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    const newStory = {
      id: randomUUID(),
      authorId,
      imageUrl,
      createdAt: now,
      expiresAt
    };

    console.log('Inserting new story into DB:', newStory);
    const db = getDb();
    await db.insert(stories).values(newStory);

    return { success: true, message: 'Story posted successfully!' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to post story' };
  }
}
