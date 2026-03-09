'use server';

import { news } from '@/db/schema';
import { randomUUID } from 'crypto';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { unstable_cache, revalidateTag, revalidatePath } from 'next/cache';
import { uploadToSocialR2 } from '@/lib/storage';

const getNewsFromDB = async () => {
  try {
    const db = getDb();
    return await db.select().from(news).orderBy(desc(news.createdAt));
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
};

export const fetchAllNews = unstable_cache(
  getNewsFromDB,
  ['all-news'],
  { tags: ['news'], revalidate: 3600 } // Cache for 1 hour
);

export async function createNews(formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const linkUrl = formData.get('linkUrl') as string;
    const imageFile = formData.get('imageFile') as File;

    if (!title || !imageFile) throw new Error('Title and Image are required');

    const imageUrl = await uploadToSocialR2(imageFile);

    const db = getDb();
    await db.insert(news).values({
      id: randomUUID(),
      title,
      imageUrl,
      linkUrl: linkUrl || null,
      isActive: 1,
      createdAt: new Date(),
    });

    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true, message: 'News added successfully' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to add news' };
  }
}

export async function deleteNews(id: string) {
  try {
    const db = getDb();
    await db.delete(news).where(eq(news.id, id));
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to delete news' };
  }
}

export async function toggleNewsStatus(id: string, currentStatus: number) {
  try {
    const db = getDb();
    await db.update(news).set({ isActive: currentStatus === 1 ? 0 : 1 }).where(eq(news.id, id));
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to toggle status' };
  }
}
