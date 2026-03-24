'use server';

import { getDb } from '@/db'; 
import { profiles, doctorDetails, studentDetails, formConfigs, profileMetadata } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
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
    const category = (formData.get('category') || formData.get('role')) as string; 
    const role = 'member';
    const fullName = formData.get('fullName') as string;
    const mobile = formData.get('mobile') as string;
    const email = formData.get('email') as string;
    const password = (formData.get('password') as string) || (formData.get('mobile') as string);
    
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

    // 1. Fetch Form Configs to determine storage modes
    const db = getDb();
    const configs = await db.select().from(formConfigs);
    
    // 2. Categorize fields
    const jsonFields: Record<string, any> = {};
    const metaFields: { fieldName: string, fieldValue: any }[] = [];
    const columnFields: Record<string, any> = {}; // These will be used for raw SQL updates

    const standardFields = [
      'category', 'role', 'fullName', 'mobile', 'email', 'password', 'dob', 'gender', 
      'maritalStatus', 'state', 'district', 'occupation', 'fatherName', 'bloodGroup',
      'membershipType', 'paymentReceipt', 'avatar',
      'degree', 'batch', 'specialization', 'registrationNo', 'experience', 'hospitalName',
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
          // Default is JSON for unknown or 'json' mode
          jsonFields[key] = value;
        }
      } else if (!standardFields.includes(key)) {
        // Any other non-standard fields go to JSON by default
        jsonFields[key] = value;
      }
    });

    // 3. Prepare Base Objects
    const dobValue = formData.get('dob') as string;
    const profileInsert = {
      id: profileId,
      fullName,
      email,
      mobile,
      passwordHash,
      role,
      category,
      gender: formData.get('gender') as string || null,
      maritalStatus: formData.get('maritalStatus') as string || null,
      dob: dobValue ? new Date(dobValue) : null,
      state: formData.get('state') as string || null,
      district: formData.get('district') as string || null,
      occupation: formData.get('occupation') as string || null,
      avatarUrl,
      fatherName: formData.get('fatherName') as string || null,
      bloodGroup: formData.get('bloodGroup') as string || null,
      membershipType: formData.get('membershipType') as string || 'member',
      paymentReceiptUrl: category !== 'guest' ? paymentReceiptUrl : null,
      paymentStatus: category !== 'guest' ? 'pending' : 'verified',
      customFields: Object.keys(jsonFields).length > 0 ? JSON.stringify(jsonFields) : null,
      createdAt: new Date(),
    };

    try {
      // 4. Standard Insert into Profiles
      await db.insert(profiles).values(profileInsert);

      // 5. Insert Meta Fields
      if (metaFields.length > 0) {
        for (const meta of metaFields) {
          await db.insert(profileMetadata).values({
            id: randomUUID(),
            profileId,
            fieldName: meta.fieldName,
            fieldValue: String(meta.fieldValue)
          });
        }
      }

      // 6. Handle Dynamic Columns
      if (Object.keys(columnFields).length > 0) {
        // Split column fields by target table
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
        // doctor/student updates will be done after their base records are created
      }

      // 7. Category specific details
      if (category === 'doctor') {
        const docId = randomUUID();
        const docDetailsBase = {
          id: docId,
          profileId,
          degree: formData.get('degree') as string || null,
          batch: formData.get('batch') as string || null,
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
          permanentAddress: formData.get('permanentAddress') as string || null,
          currentAddress: formData.get('currentAddress') as string || null,
        };
        await db.insert(doctorDetails).values(docDetailsBase);

        // Update Doctor Dynamic Columns
        const doctorCols = {}; // We'll re-extract for clarity or just use the pre-filtered ones
        for (const [key, val] of Object.entries(columnFields)) {
          if (configs.find(c => c.fieldName === key)?.section === 'doctor') {
            (doctorCols as any)[key] = val;
          }
        }
        if (Object.keys(doctorCols).length > 0) {
          const parts: any[] = [];
          parts.push(sql.raw(`UPDATE doctor_details SET `));
          const entries = Object.entries(doctorCols);
          entries.forEach(([key, val], idx) => {
            parts.push(sql.raw(`${key} = `));
            parts.push(sql`${val}`);
            if (idx < entries.length - 1) parts.push(sql.raw(', '));
          });
          parts.push(sql.raw(` WHERE id = `));
          parts.push(sql`${docId}`);
          await db.run(sql.join(parts));
        }
      } 
      else if (category === 'student') {
        const stuId = randomUUID();
        const collegeEntryYear = formData.get('collegeEntryYear') as string;
        const stuDetailsBase = {
          id: stuId,
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
          permanentAddress: formData.get('permanentAddress') as string || null,
          currentAddress: formData.get('currentAddress') as string || null,
        };
        await db.insert(studentDetails).values(stuDetailsBase);

        // Update Student Dynamic Columns
        const studentCols = {};
        for (const [key, val] of Object.entries(columnFields)) {
          if (configs.find(c => c.fieldName === key)?.section === 'student') {
            (studentCols as any)[key] = val;
          }
        }
        if (Object.keys(studentCols).length > 0) {
          const parts: any[] = [];
          parts.push(sql.raw(`UPDATE student_details SET `));
          const entries = Object.entries(studentCols);
          entries.forEach(([key, val], idx) => {
            parts.push(sql.raw(`${key} = `));
            parts.push(sql`${val}`);
            if (idx < entries.length - 1) parts.push(sql.raw(', '));
          });
          parts.push(sql.raw(` WHERE id = `));
          parts.push(sql`${stuId}`);
          await db.run(sql.join(parts));
        }
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
