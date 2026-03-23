'use server';

import { profiles, doctorDetails, studentDetails, formConfigs, profileMetadata } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { revalidatePath } from 'next/cache';
import { uploadToR2 } from '@/lib/storage';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { randomUUID } from 'crypto';
import { getMergedProfileData } from '@/lib/profileUtils';

export async function fetchUserProfile(profileId: string) {
  return await getMergedProfileData(profileId);
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
    
    // Categorize fields dynamically based on configs
    const configs = await db.select().from(formConfigs);
    const jsonFields: Record<string, any> = {};
    const metaFields: { fieldName: string, fieldValue: any }[] = [];
    const columnFields: Record<string, any> = {};

    const standardFields = [
      'profileId', 'category', 'fullName', 'mobile', 'email', 'dob', 'gender', 
      'maritalStatus', 'state', 'district', 'occupation', 'fatherName', 'bloodGroup',
      'avatar', 'degree', 'batch', 'specialization', 'registrationNo', 'experience', 'hospitalName',
      'presentWorkingPlace', 'clinicAddress', 'consultationFee', 'availabilityTimings',
      'memberships', 'awards', 'websiteSocialLinks',
      'college', 'university', 'course', 'year', 'collegeEntryYear', 'gotraFather',
      'gotraMother', 'gotraGrandmother', 'futureGoals', 'internshipStatus', 
      'hobbiesInterests', 'linkedinProfile', 'bloodDonationWillingness',
      'permanentAddress', 'currentAddress'
    ];

    formData.forEach((value, key) => {
      if (key.startsWith('$ACTION')) return;
      const config = configs.find(c => c.fieldName === key);
      if (config) {
        if (config.storageMode === 'meta') {
          metaFields.push({ fieldName: key, fieldValue: value });
        } else if (config.storageMode === 'column') {
          columnFields[key] = value;
        } else {
          jsonFields[key] = value;
        }
      } else if (!standardFields.includes(key)) {
        jsonFields[key] = value;
      }
    });

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
      fatherName: formData.get('fatherName') as string,
      bloodGroup: formData.get('bloodGroup') as string,
      customFields: Object.keys(jsonFields).length > 0 ? JSON.stringify(jsonFields) : null,
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

    // Process Meta Fields
    if (metaFields.length > 0) {
      await db.delete(profileMetadata).where(eq(profileMetadata.profileId, profileId));
      for (const meta of metaFields) {
        await db.insert(profileMetadata).values({
          id: randomUUID(),
          profileId,
          fieldName: meta.fieldName,
          fieldValue: String(meta.fieldValue)
        });
      }
    }

    // Handle Dynamic Columns
    if (Object.keys(columnFields).length > 0) {
      const profileCols: Record<string, any> = {};
      const doctorCols: Record<string, any> = {};
      const studentCols: Record<string, any> = {};

      for (const [key, val] of Object.entries(columnFields)) {
        const config = configs.find(c => c.fieldName === key);
        if (config?.section === 'doctor') doctorCols[key] = val;
        else if (config?.section === 'student') studentCols[key] = val;
        else profileCols[key] = val;
      }

      const updateTable = async (tableName: string, idVal: string, idCol: string, fields: Record<string, any>) => {
        if (Object.keys(fields).length === 0) return;
        const parts: any[] = [];
        parts.push(sql.raw(`UPDATE ${tableName} SET `));
        const entries = Object.entries(fields);
        entries.forEach(([key, val], idx) => {
          parts.push(sql.raw(`${key} = `));
          parts.push(sql`${val}`);
          if (idx < entries.length - 1) parts.push(sql.raw(', '));
        });
        parts.push(sql.raw(` WHERE ${idCol} = `));
        parts.push(sql`${idVal}`);
        await db.run(sql.join(parts));
      };

      await updateTable('profiles', profileId, 'id', profileCols);
      
      const category = formData.get('category') as string;
      if (category === 'doctor') {
        const existingDoc = await db.select().from(doctorDetails).where(eq(doctorDetails.profileId, profileId)).limit(1);
        if (existingDoc.length > 0) await updateTable('doctor_details', profileId, 'profile_id', doctorCols);
      } else if (category === 'student') {
        const existingStu = await db.select().from(studentDetails).where(eq(studentDetails.profileId, profileId)).limit(1);
        if (existingStu.length > 0) await updateTable('student_details', profileId, 'profile_id', studentCols);
      }
    }

    // 2. Prepare Category-Specific Update
    const category = formData.get('category') as string;
    if (category === 'doctor') {
      const docData = {
        degree: formData.get('degree') as string,
        batch: formData.get('batch') as string,
        specialization: formData.get('specialization') as string,
        hospitalName: formData.get('hospitalName') as string,
        presentWorkingPlace: formData.get('presentWorkingPlace') as string,
        registrationNo: formData.get('registrationNo') as string,
        experience: Number(formData.get('experience')) || 0,
        clinicAddress: formData.get('clinicAddress') as string,
        consultationFee: Number(formData.get('consultationFee')) || 0,
        availabilityTimings: formData.get('availabilityTimings') as string,
        memberships: formData.get('memberships') as string,
        awards: formData.get('awards') as string,
        websiteSocialLinks: formData.get('websiteSocialLinks') as string,
        permanentAddress: formData.get('permanentAddress') as string,
        currentAddress: formData.get('currentAddress') as string,
      };
      
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
        collegeEntryYear: Number(formData.get('collegeEntryYear')) || 0,
        gotraFather: formData.get('gotraFather') as string,
        gotraMother: formData.get('gotraMother') as string,
        gotraGrandmother: formData.get('gotraGrandmother') as string,
        futureGoals: formData.get('futureGoals') as string,
        internshipStatus: formData.get('internshipStatus') as string,
        hobbiesInterests: formData.get('hobbiesInterests') as string,
        linkedinProfile: formData.get('linkedinProfile') as string,
        bloodDonationWillingness: formData.get('bloodDonationWillingness') as string,
        permanentAddress: formData.get('permanentAddress') as string,
        currentAddress: formData.get('currentAddress') as string,
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
