'use server';

import { profiles } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
// import { getDb } from '@/db';

export async function checkMembershipStatus(profileId: string) {
  try {
    // const db = getDb(process.env as any);
    /* --- REAL DB LOGIC ---
    const user = await db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);
    if (!user || user.length === 0) return null;
    const profile = user[0];
    */

    // --- MOCK DATA --- 
    const profile = {
      id: profileId,
      fullName: 'Dr. Rahul Mehta',
      membershipType: '2-year', // 'member', '2-year', 'aajivan', 'patron', 'vishisht'
      paymentStatus: 'verified',
      expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Expires in 15 days
    };

    if (['patron', 'vishisht', 'aajivan'].includes(profile.membershipType)) {
      return {
        isActive: true,
        isExpiringSoon: false,
        isExpired: false,
        message: `Active (${profile.membershipType.toUpperCase()}) - No Renewal Required`,
        expiresAt: null
      };
    }

    if (!profile.expiresAt) {
        return { isActive: true, isExpiringSoon: false, isExpired: false, message: 'Active', expiresAt: null };
    }

    const now = new Date();
    const expiryDate = new Date(profile.expiresAt);
    
    // Calculate difference in days
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
         isActive: false,
         isExpiringSoon: false,
         isExpired: true,
         message: 'Membership Expired. Please renew to restore directory listing and portal access.',
         expiresAt: expiryDate
      };
    } else if (diffDays <= 30) {
      return {
         isActive: true,
         isExpiringSoon: true,
         isExpired: false,
         message: `Membership expiring in ${diffDays} days. Please renew soon.`,
         expiresAt: expiryDate
      };
    }

    return {
      isActive: true,
      isExpiringSoon: false,
      isExpired: false,
      message: 'Active',
      expiresAt: expiryDate
    };

  } catch (error) {
    console.error('Error checking membership:', error);
    return null;
  }
}

// Optional: Cloudflare Worker scheduled event handler (Cron Job) logic stub
// In a real CF worker, you export a `scheduled` function that runs daily
export async function runDailyMembershipCron() {
    /* 
    const db = getDb(process.env as any);
    const now = new Date();
    
    // 1. Find all '2-year' or 'member' whose expiry is less than now
    const expiredUsers = await db.select().from(profiles)
       .where(and(
           sql`${profiles.expiresAt} < ${now.toISOString()}`,
           eq(profiles.paymentStatus, 'verified')
       ));

    // 2. Demote '2-year' to 'member' or block access
    for (const user of expiredUsers) {
        if (user.membershipType === '2-year') {
             // Demote or mark as expired depending on business rules
             await db.update(profiles).set({ paymentStatus: 'expired' }).where(eq(profiles.id, user.id));
             // Trigger AI Notification Email/SMS...
        }
    }
    return { success: true, processed: expiredUsers.length };
    */
   return { success: true, processed: 0, message: "Cron Job Triggered" };
}
