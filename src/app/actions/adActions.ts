'use server';

import { advertisements } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db';
import { randomUUID } from 'crypto';

import { sql } from 'drizzle-orm';
import { uploadToSocialR2 } from '@/lib/storage';

export async function ensureAdTableExists() {
    try {
        const db = getDb();
        await db.run(sql`
            CREATE TABLE IF NOT EXISTS advertisements (
                id TEXT PRIMARY KEY,
                business_name TEXT NOT NULL,
                contact_person TEXT NOT NULL,
                mobile TEXT NOT NULL,
                image_urls TEXT NOT NULL,
                link_url TEXT,
                status TEXT NOT NULL DEFAULT 'pending',
                created_at INTEGER NOT NULL
            )
        `);
    } catch (e) {
        console.error('[DB] Failed to ensure advertisements table exists:', e);
    }
}

export async function submitAdRequest(formData: FormData) {
  try {
    await ensureAdTableExists();
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
      try {
        const url = await uploadToSocialR2(file);
        console.log(`[Ad] Successfully uploaded image ${i+1}: ${url}`);
        return {
          url,
          description: descriptions[i] || ''
        };
      } catch (uploadErr) {
        console.error(`[Ad] Failed to upload image ${i+1}:`, uploadErr);
        return { url: '', description: '' };
      }
    });

    const adItems = (await Promise.all(uploadPromises)).filter(item => item.url !== '');

    if (adItems.length === 0) {
      console.warn('[Ad] No images were successfully uploaded.');
      return { success: false, message: 'Failed to upload images. Please check your connection.' };
    }

    // 2. Insert into DB
    try {
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
        console.log(`[DB] Ad request successfully inserted: ${id}`);
    } catch (dbErr: any) {
        console.error('[DB] Failed to insert ad request:', dbErr);
        if (dbErr.message?.includes('no such table')) {
            console.log('[DB] Attempting to create advertisements table...');
            // Optional: Run a manual create if really needed, but let's see the error first
        }
        throw dbErr;
    }

    revalidatePath('/admin');
    revalidatePath('/desktop/admin');
    return { success: true, message: 'Ad request submitted successfully. Waiting for approval.' };
  } catch (error: any) {
    console.error('Final Error submitting ad request:', error);
    return { success: false, message: error.message || 'Failed to submit ad request.' };
  }
}

export async function fetchAdsForAdmin() {
  try {
    await ensureAdTableExists();
    const db = getDb();
    const ads = await db.select().from(advertisements).orderBy(desc(advertisements.createdAt));
    console.log(`[DB] Fetched ${ads.length} ads for admin review.`);
    return ads;
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
    revalidatePath('/desktop/admin');
    revalidatePath('/'); 
// Assuming ads show on home page
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
