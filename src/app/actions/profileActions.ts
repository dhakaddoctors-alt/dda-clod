'use server';

import { profiles, doctorDetails, studentDetails } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { revalidatePath } from 'next/cache';
import { uploadToR2 } from '@/lib/storage';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { randomUUID } from 'crypto';

export async function fetchUserProfile(profileId: string) {
  try {
    const db = getDb();

    const user = await db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);
    
    if (!user || user.length === 0) return null;
    const baseProfile = user[0];

    let extraDetails = null;

    if (baseProfile.category === 'doctor') {
      const docRaw = await db.select().from(doctorDetails).where(eq(doctorDetails.profileId, profileId)).limit(1);
      extraDetails = docRaw[0] || null;
    } else if (baseProfile.category === 'student') {
      const stuRaw = await db.select().from(studentDetails).where(eq(studentDetails.profileId, profileId)).limit(1);
      extraDetails = stuRaw[0] || null;
    }

    return { ...baseProfile, details: extraDetails };

  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

export async function updateUserProfile(formData: FormData) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session) throw new Error('Not authenticated');

    const profileId = formData.get('profileId') as string;
    const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin';
    const isOwner = session.user.id === profileId;

    if (!isAdmin && !isOwner) {
      throw new Error('Unauthorized to update this profile');
    }

    const db = getDb();
    
    // 1. Prepare Base Profile Update
    const dob = formData.get('dob') as string;
    const updateData: any = {
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      mobile: formData.get('mobile') as string,
      gender: formData.get('gender') as string,
      maritalStatus: formData.get('maritalStatus') as string,
      dob: dob ? new Date(dob) : null,
      state: formData.get('state') as string,
      district: formData.get('district') as string,
      occupation: formData.get('occupation') as string,
      category: formData.get('category') as string,
    };

    // Handle optional avatar upload
    const avatarFile = formData.get('avatar') as File | null;
    if (avatarFile && avatarFile.size > 0) {
      const avatarUrl = await uploadToR2(avatarFile);
      if (avatarUrl) {
        updateData.avatarUrl = avatarUrl;
      }
    }

    // Perform Base Update
    await db.update(profiles)
      .set(updateData)
      .where(eq(profiles.id, profileId));

    // 2. Prepare Category-Specific Update
    const category = formData.get('category') as string;
    if (category === 'doctor') {
      const docData = {
        degree: formData.get('degree') as string,
        specialization: formData.get('specialization') as string,
        hospitalName: formData.get('hospitalName') as string,
        registrationNo: formData.get('registrationNo') as string,
        experience: Number(formData.get('experience')) || 0,
        clinicAddress: formData.get('clinicAddress') as string,
      };
      
      // Check if details exist, if not insert, else update
      const existing = await db.select().from(doctorDetails).where(eq(doctorDetails.profileId, profileId)).limit(1);
      if (existing.length > 0) {
        await db.update(doctorDetails).set(docData).where(eq(doctorDetails.profileId, profileId));
      } else {
        await db.insert(doctorDetails).values({ id: randomUUID(), profileId, ...docData });
      }
    } 
    else if (category === 'student') {
      const stuData = {
        college: formData.get('college') as string,
        university: formData.get('university') as string,
        course: formData.get('course') as string,
        year: formData.get('year') as string,
        gotraFather: formData.get('gotraFather') as string,
        gotraMother: formData.get('gotraMother') as string,
      };

      const existing = await db.select().from(studentDetails).where(eq(studentDetails.profileId, profileId)).limit(1);
      if (existing.length > 0) {
        await db.update(studentDetails).set(stuData).where(eq(studentDetails.profileId, profileId));
      } else {
        await db.insert(studentDetails).values({ id: randomUUID(), profileId, ...stuData });
      }
    }

    revalidatePath(`/directory/${profileId}`);
    revalidatePath('/directory');
    
    return { success: true, message: 'Profile updated successfully!' };
  } catch (error: any) {
    console.error('Update Profile Error:', error);
    return { success: false, message: error.message || 'Failed to update profile.' };
  }
}
