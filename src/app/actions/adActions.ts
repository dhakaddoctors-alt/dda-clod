'use server';

import { advertisements } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db';
import { randomUUID } from 'crypto';

import { uploadToSocialR2 } from '@/lib/storage';

export async function submitAdRequest(formData: FormData) {
  try {
    const db = getDb();
    const id = `ad_${randomUUID()}`;

    const businessName = formData.get('businessName') as string;
    const contactPerson = formData.get('contactPerson') as string;
    const mobile = formData.get('mobile') as string;
    const linkUrl = formData.get('linkUrl') as string;
    
    // Get all files and their corresponding descriptions
    const files = formData.getAll('files') as File[];
    const descriptions = formData.getAll('descriptions') as string[];

    console.log(`[Ad] Processing submission for ${businessName} with ${files.length} images.`);

    // 1. Upload files to R2 on the SERVER
    const uploadPromises = files.map(async (file, i) => {
      const url = await uploadToSocialR2(file);
      return {
        url,
        description: descriptions[i] || ''
      };
    });

    const adItems = (await Promise.all(uploadPromises)).filter(item => item.url !== '');

    if (adItems.length === 0) {
      return { success: false, message: 'Failed to upload images. Please check your connection.' };
    }

    // 2. Insert into DB
    await db.insert(advertisements).values({
      id,
      businessName,
      contactPerson,
      mobile,
      imageUrls: JSON.stringify(adItems),
      linkUrl: linkUrl || null,
      status: 'pending',
      createdAt: new Date(),
    });

    console.log(`[DB] Ad request submitted: ${id}`);
    revalidatePath('/admin');
    return { success: true, message: 'Ad request submitted successfully. Waiting for approval.' };
  } catch (error: any) {
    console.error('Error submitting ad request:', error);
    return { success: false, message: error.message || 'Failed to submit ad request.' };
  }
}

export async function fetchAdsForAdmin() {
  try {
    const db = getDb();
    return await db.select().from(advertisements).orderBy(desc(advertisements.createdAt));
  } catch (error) {
    console.error('Error fetching ads for admin:', error);
    return [];
  }
}

export async function updateAdStatus(adId: string, newStatus: 'pending' | 'approved' | 'rejected' | 'expired') {
  try {
    const db = getDb();

    await db.update(advertisements)
      .set({ status: newStatus })
      .where(eq(advertisements.id, adId));

    console.log(`[DB] Updated ad status: ${adId} to ${newStatus}`);
    revalidatePath('/admin');
    revalidatePath('/'); // Assuming ads show on home page
    return { success: true, message: `Ad ${newStatus} successfully.` };
  } catch (error: any) {
    console.error('Error updating ad status:', error);
    return { success: false, message: error.message || 'Failed to update ad status.' };
  }
}

export async function fetchActiveAds() {
  try {
    const db = getDb();
    return await db.select().from(advertisements).where(eq(advertisements.status, 'approved')).orderBy(desc(advertisements.createdAt));
  } catch (error) {
    console.error('Error fetching active ads:', error);
    return [];
  }
}

export async function deleteAd(adId: string) {
    try {
      const db = getDb();
      await db.delete(advertisements).where(eq(advertisements.id, adId));
      revalidatePath('/admin');
      return { success: true, message: 'Ad deleted successfully.' };
    } catch (error: any) {
      console.error('Error deleting ad:', error);
      return { success: false, message: error.message || 'Failed to delete ad.' };
    }
}
