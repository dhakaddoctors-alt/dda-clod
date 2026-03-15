'use server';

import { advertisements } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db';
import { randomUUID } from 'crypto';

export async function submitAdRequest(data: {
  businessName: string;
  contactPerson: string;
  mobile: string;
  imageUrls: { url: string; description: string }[];
  linkUrl?: string;
}) {
  try {
    const db = getDb();
    const id = `ad_${randomUUID()}`;

    await db.insert(advertisements).values({
      id,
      businessName: data.businessName,
      contactPerson: data.contactPerson,
      mobile: data.mobile,
      imageUrls: JSON.stringify(data.imageUrls),
      linkUrl: data.linkUrl || null,
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
