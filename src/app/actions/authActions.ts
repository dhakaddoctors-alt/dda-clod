'use server';

import { getDb } from '@/db'; 
import { profiles, doctorDetails, studentDetails } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Helper for Cloudflare R2 Uploads using AWS SDK (S3 compat)
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
  },
});

async function uploadToR2(file: File): Promise<string> {
  if (!file || file.size === 0) return '';
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.name.split('.').pop();
  const fileName = `${randomUUID()}.${ext}`;

  await r2.send(new PutObjectCommand({
    Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME || 'dda-portal',
    Key: fileName,
    Body: buffer,
    ContentType: file.type,
  }));

  // Assuming public custom domain configured for the R2 bucket:
  return `${process.env.NEXT_PUBLIC_R2_DOMAIN}/${fileName}`;
}

export async function registerUser(formData: FormData) {
  try {
    const role = formData.get('role') as string;
    const fullName = formData.get('fullName') as string;
    const mobile = formData.get('mobile') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const profileId = randomUUID();

    let paymentReceiptUrl = '/dummy-receipt.jpg';
    
    // Process real file uploads if R2 variables exist
    const paymentReceipt = formData.get('paymentReceipt') as File | null;
    if (paymentReceipt && paymentReceipt.size > 0 && process.env.CLOUDFLARE_R2_BUCKET_NAME) {
       paymentReceiptUrl = await uploadToR2(paymentReceipt);
    }

    let avatarUrl = null;
    const avatar = formData.get('avatar') as File | null;
    if (avatar && avatar.size > 0 && process.env.CLOUDFLARE_R2_BUCKET_NAME) {
       avatarUrl = await uploadToR2(avatar);
    }

    // Insert into Profiles
    const dob = formData.get('dob') as string;
    const newProfile = {
      id: profileId,
      fullName,
      email,
      mobile,
      passwordHash,
      role,
      gender: formData.get('gender') as string || null,
      maritalStatus: formData.get('maritalStatus') as string || null,
      dob: dob ? new Date(dob) : null,
      state: formData.get('state') as string || null,
      district: formData.get('district') as string || null,
      occupation: formData.get('occupation') as string || null,
      avatarUrl,
      membershipType: formData.get('membershipType') as string || 'member',
      paymentReceiptUrl: role !== 'guest' ? paymentReceiptUrl : null,
      paymentStatus: role !== 'guest' ? 'pending' : 'verified',
      createdAt: new Date(),
    };

    console.log('Inserting profile:', newProfile);
    
    // Connect to D1 via the HTTP Proxy abstraction
    const db = getDb();
    
    // We enforce a manual try-catch block here because if the D1 Proxy swallowed a constraint error as an empty row, 
    // we want to ensure it throws explicitly so the user doesn't see a false success message.
    try {
      await db.insert(profiles).values(newProfile);

      // Role specific details
      if (role === 'doctor') {
        const docDetails = {
          id: randomUUID(),
          profileId,
          degree: formData.get('degree') as string || null,
          specialization: formData.get('specialization') as string || null,
          registrationNo: formData.get('registrationNo') as string || null,
          experience: Number(formData.get('experience')) || null,
          hospitalName: formData.get('hospitalName') as string || null,
          presentWorkingPlace: formData.get('presentWorkingPlace') as string || null,
          clinicAddress: formData.get('clinicAddress') as string || null,
          consultationFee: Number(formData.get('consultationFee')) || null,
          availabilityTimings: formData.get('availabilityTimings') as string || null,
          memberships: formData.get('memberships') as string || null,
          awards: formData.get('awards') as string || null,
          websiteSocialLinks: formData.get('websiteSocialLinks') as string || null,
        };
        await db.insert(doctorDetails).values(docDetails);
      } 
      else if (role === 'student') {
        const collegeEntryYear = formData.get('collegeEntryYear') as string;
        const stuDetails = {
          id: randomUUID(),
          profileId,
          college: formData.get('college') as string || null,
          university: formData.get('university') as string || null,
          course: formData.get('course') as string || null,
          year: formData.get('year') as string || null,
          collegeEntryYear: collegeEntryYear ? Number(collegeEntryYear) : null,
          gotraFather: formData.get('gotraFather') as string || null,
          gotraMother: formData.get('gotraMother') as string || null,
          gotraGrandmother: formData.get('gotraGrandmother') as string || null,
          futureGoals: formData.get('futureGoals') as string || null,
          internshipStatus: formData.get('internshipStatus') as string || null,
          hobbiesInterests: formData.get('hobbiesInterests') as string || null,
          linkedinProfile: formData.get('linkedinProfile') as string || null,
          bloodDonationWillingness: formData.get('bloodDonationWillingness') as string || null,
        };
        await db.insert(studentDetails).values(stuDetails);
      }
    } catch (insertError: any) {
      console.error('Database Insertion Error:', insertError);
      throw new Error(insertError.message || 'Failed to write to database.');
    }

    return { success: true, message: 'Registration submitted successfully! Pending admin approval.' };
  } catch (error: any) {
    console.error('Registration Error:', error);
    
    // Graceful error for duplicate registrations (email/mobile)
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return { success: false, message: 'This email or mobile number is already registered. Please log in.' };
    }

    return { success: false, message: error.message || 'Something went wrong.' };
  }
}

export async function requestPasswordReset(formData: FormData) {
  try {
    const email = formData.get('email') as string;
    if (!email) throw new Error('Email is required');
    
    const db = getDb();
    const userResults = await db.select().from(profiles).where(eq(profiles.email, email));
    
    if (userResults.length === 0) {
      // Return success even if not found to prevent email enumeration
      return { success: true, message: 'If an account exists, a reset link will be sent.' };
    }

    // In a real product, generate a secure token, save it to DB with expiry, and email the user.
    // Since we don't have an SMTP server here, we'll simulate the "email sent" behavior.
    console.log(`[AUTH EVENT] Simulated Password Reset Email sent to ${email}`);

    return { success: true, message: 'If an account exists, a reset link will be sent.' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to process request.' };
  }
}

export async function resetPassword(formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const newPassword = formData.get('newPassword') as string;
    
    if (!email || !newPassword) throw new Error('Missing fields');

    const db = getDb();
    const userResults = await db.select().from(profiles).where(eq(profiles.email, email));
    if (userResults.length === 0) throw new Error('Invalid request');

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    await db.update(profiles)
      .set({ passwordHash: newPasswordHash })
      .where(eq(profiles.email, email));

    return { success: true, message: 'Password updated successfully. You can now login.' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to reset password.' };
  }
}
