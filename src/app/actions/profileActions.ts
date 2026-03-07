'use server';

import { profiles, doctorDetails, studentDetails } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';

export async function fetchUserProfile(profileId: string) {
  try {
    const db = getDb();

    const user = await db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);
    
    if (!user || user.length === 0) return null;
    const baseProfile = user[0];

    let extraDetails = null;

    if (baseProfile.role === 'doctor') {
      const docRaw = await db.select().from(doctorDetails).where(eq(doctorDetails.profileId, profileId)).limit(1);
      extraDetails = docRaw[0] || null;
    } else if (baseProfile.role === 'student') {
      const stuRaw = await db.select().from(studentDetails).where(eq(studentDetails.profileId, profileId)).limit(1);
      extraDetails = stuRaw[0] || null;
    }

    return { ...baseProfile, details: extraDetails };

  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}
