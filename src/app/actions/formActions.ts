'use server';

import { formConfigs } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

async function checkAdminAccess() {
  const session = await getServerSession(authOptions) as any;
  if (!session) return { allowed: false, role: null };
  const role = session.user.role;
  const isAllowed = role === 'admin' || role === 'super_admin' || role === 'editor';
  return { allowed: isAllowed, role };
}

export async function fetchFormConfigs() {
  try {
    const db = getDb();
    return await db.select().from(formConfigs).orderBy(sql`${formConfigs.orderIndex} ASC`);
  } catch (error) {
    console.error('Error fetching form configs:', error);
    return [];
  }
}

export async function updateFormConfig(id: string, data: Partial<typeof formConfigs.$inferInsert>) {
  try {
    const { allowed } = await checkAdminAccess();
    if (!allowed) throw new Error('Unauthorized');
    const db = getDb();

    // Remove immutable fields if present
    const { id: _, fieldName: __, ...updateData } = data as any;

    await db.update(formConfigs)
      .set(updateData)
      .where(eq(formConfigs.id, id));

    revalidatePath('/admin');
    revalidatePath('/register');
    return { success: true, message: 'Configuration updated' };
  } catch (error: any) {
    console.error('Error updating form config:', error);
    return { success: false, message: error.message || 'Failed to update config' };
  }
}

export async function updateFormConfigsOrder(updates: { id: string, orderIndex: number }[]) {
  try {
    const { allowed } = await checkAdminAccess();
    if (!allowed) throw new Error('Unauthorized');
    const db = getDb();

    // Use a transaction for bulk update if possible, or parallel updates
    for (const update of updates) {
      await db.update(formConfigs)
        .set({ orderIndex: update.orderIndex })
        .where(eq(formConfigs.id, update.id));
    }

    revalidatePath('/admin');
    revalidatePath('/register');
    return { success: true, message: 'Order updated' };
  } catch (error: any) {
    console.error('Error updating order:', error);
    return { success: false, message: error.message || 'Failed to update order' };
  }
}

export async function addFormConfig(section: string, categoryScope: string = 'all', storageMode: 'json' | 'meta' | 'column' = 'json') {
  try {
    const { allowed } = await checkAdminAccess();
    if (!allowed) throw new Error('Unauthorized');
    const db = getDb();
    const id = Math.random().toString(36).substring(2, 9);
    const fieldName = `custom_${id}`;

    // If storageMode is 'column', alter the table
    if (storageMode === 'column') {
      let targetTable = 'profiles';
      if (section === 'doctor') targetTable = 'doctor_details';
      if (section === 'student') targetTable = 'student_details';

      try {
        await db.run(sql.raw(`ALTER TABLE ${targetTable} ADD COLUMN ${fieldName} TEXT`));
      } catch (e: any) {
        console.error('ALTER TABLE Error:', e);
        throw new Error(`Failed to create column in ${targetTable}: ${e.message}`);
      }
    }

    await db.insert(formConfigs).values({
      id,
      fieldName,
      label: 'New Field',
      section,
      isVisible: 1,
      isRequired: 0,
      categoryScope,
      fieldType: 'text',
      storageMode,
      showInProfile: 1,
      showInPdf: 1,
      showInDirectory: 1,
      showOnIdCard: 0
    });

    revalidatePath('/admin');
    revalidatePath('/register');
    return { success: true, message: 'Field added successfully' };
  } catch (error: any) {
    console.error('Error adding form config:', error);
    return { success: false, message: error.message || 'Failed to add field' };
  }
}

export async function deleteFormConfig(id: string) {
  try {
    const { allowed, role } = await checkAdminAccess();
    if (!allowed) throw new Error('Unauthorized');
    const db = getDb();
    
    // Prevent deleting system fields (those with numeric IDs from 1-40)
    const idNum = parseInt(id);
    if (!isNaN(idNum) && idNum >= 1 && idNum <= 40) {
      throw new Error('System fields cannot be deleted');
    }

    // Check if it's a 'column' type field
    const config = await db.select().from(formConfigs).where(eq(formConfigs.id, id)).get();
    if (config?.storageMode === 'column') {
      if (role !== 'super_admin') {
        throw new Error('Only Super Admin can delete search-optimized (column) fields.');
      }
      // Note: We don't drop the column to prevent data loss.
      // We just remove it from form_configs.
    }

    await db.delete(formConfigs).where(eq(formConfigs.id, id));

    revalidatePath('/admin');
    revalidatePath('/register');
    return { success: true, message: 'Field deleted successfully' };
  } catch (error: any) {
    console.error('Error deleting form config:', error);
    return { success: false, message: error.message || 'Failed to delete field' };
  }
}

export async function initializeFormConfigs() {
  try {
    const db = getDb();
    const existing = await db.select().from(formConfigs);
    if (existing.length > 0) return { success: true, message: 'Already initialized' };

    const defaults = [
      // Basic Info
      { id: '1', fieldName: 'fullName', label: 'Full Name', section: 'basic', isVisible: 1, isRequired: 1, categoryScope: 'all', showOnIdCard: 1 },
      { id: '2', fieldName: 'fatherName', label: "Father's Name", section: 'basic', isVisible: 1, isRequired: 1, categoryScope: 'all', showOnIdCard: 0 },
      { id: '3', fieldName: 'mobile', label: 'Mobile Number', section: 'basic', isVisible: 1, isRequired: 1, categoryScope: 'all', showOnIdCard: 0 },
      { id: '4', fieldName: 'email', label: 'Email Address', section: 'basic', isVisible: 1, isRequired: 1, categoryScope: 'all', showOnIdCard: 0 },
      { id: '5', fieldName: 'dob', label: 'Date of Birth', section: 'basic', isVisible: 1, isRequired: 0, categoryScope: 'all', showOnIdCard: 0 },
      { id: '6', fieldName: 'gender', label: 'Gender', section: 'basic', isVisible: 1, isRequired: 0, categoryScope: 'all', showOnIdCard: 0 },
      { id: '7', fieldName: 'maritalStatus', label: 'Marital Status', section: 'basic', isVisible: 1, isRequired: 0, categoryScope: 'all', showOnIdCard: 0 },
      { id: '8', fieldName: 'bloodGroup', label: 'Blood Group', section: 'basic', isVisible: 1, isRequired: 0, categoryScope: 'all', showOnIdCard: 1 },
      { id: '9', fieldName: 'state', label: 'State / UT', section: 'basic', isVisible: 1, isRequired: 1, categoryScope: 'all', showOnIdCard: 0 },
      { id: '10', fieldName: 'district', label: 'District', section: 'basic', isVisible: 1, isRequired: 0, categoryScope: 'all', showOnIdCard: 0 },
      { id: '11', fieldName: 'avatar', label: 'Profile Photo', section: 'basic', isVisible: 1, isRequired: 0, categoryScope: 'all', showOnIdCard: 1 },

      // Guest Specific
      { id: '12', fieldName: 'occupation', label: 'Occupation', section: 'guest', isVisible: 1, isRequired: 0, categoryScope: 'guest', showOnIdCard: 0 },

      // Doctor Specific
      { id: '13', fieldName: 'degree', label: 'Medical Degree', section: 'doctor', isVisible: 1, isRequired: 1, categoryScope: 'doctor', showOnIdCard: 0 },
      { id: '14', fieldName: 'batch', label: 'Batch Year', section: 'doctor', isVisible: 1, isRequired: 0, categoryScope: 'doctor', showOnIdCard: 0 },
      { id: '15', fieldName: 'specialization', label: 'Specialization', section: 'doctor', isVisible: 1, isRequired: 0, categoryScope: 'doctor', showOnIdCard: 0 },
      { id: '16', fieldName: 'registrationNo', label: 'Medical Registration No.', section: 'doctor', isVisible: 1, isRequired: 1, categoryScope: 'doctor', showOnIdCard: 0 },
      { id: '17', fieldName: 'experience', label: 'Experience (Years)', section: 'doctor', isVisible: 1, isRequired: 0, categoryScope: 'doctor', showOnIdCard: 0 },
      { id: '18', fieldName: 'hospitalName', label: 'Hospital / Clinic Name', section: 'doctor', isVisible: 1, isRequired: 0, categoryScope: 'doctor', showOnIdCard: 0 },
      { id: '19', fieldName: 'presentWorkingPlace', label: 'Present Working Place', section: 'doctor', isVisible: 1, isRequired: 0, categoryScope: 'doctor', showOnIdCard: 1 },
      { id: '20', fieldName: 'consultationFee', label: 'Consultation Fee (₹)', section: 'doctor', isVisible: 1, isRequired: 0, categoryScope: 'doctor', showOnIdCard: 0 },
      { id: '21', fieldName: 'availabilityTimings', label: 'Availability Timings', section: 'doctor', isVisible: 1, isRequired: 0, categoryScope: 'doctor', showOnIdCard: 0 },
      { id: '22', fieldName: 'clinicAddress', label: 'Clinic Address', section: 'doctor', isVisible: 1, isRequired: 0, categoryScope: 'doctor', showOnIdCard: 0 },
      { id: '23', fieldName: 'memberships', label: 'Memberships / Associations', section: 'doctor', isVisible: 1, isRequired: 0, categoryScope: 'doctor', showOnIdCard: 0 },
      { id: '24', fieldName: 'awards', label: 'Awards & Achievements', section: 'doctor', isVisible: 1, isRequired: 0, categoryScope: 'doctor', showOnIdCard: 0 },
      { id: '25', fieldName: 'websiteSocialLinks', label: 'Website / Social Links', section: 'doctor', isVisible: 1, isRequired: 0, categoryScope: 'doctor', showOnIdCard: 0 },

      // Student Specific
      { id: '26', fieldName: 'college', label: 'College / Institute Name', section: 'student', isVisible: 1, isRequired: 1, categoryScope: 'student', showOnIdCard: 1 },
      { id: '27', fieldName: 'university', label: 'University', section: 'student', isVisible: 1, isRequired: 0, categoryScope: 'student', showOnIdCard: 0 },
      { id: '28', fieldName: 'course', label: 'Course (e.g. MBBS)', section: 'student', isVisible: 1, isRequired: 1, categoryScope: 'student', showOnIdCard: 0 },
      { id: '29', fieldName: 'year', label: 'Current Year / Semester', section: 'student', isVisible: 1, isRequired: 1, categoryScope: 'student', showOnIdCard: 0 },
      { id: '30', fieldName: 'collegeEntryYear', label: 'College Entry Year', section: 'student', isVisible: 1, isRequired: 0, categoryScope: 'student', showOnIdCard: 0 },
      { id: '31', fieldName: 'internshipStatus', label: 'Internship Status', section: 'student', isVisible: 1, isRequired: 0, categoryScope: 'student', showOnIdCard: 0 },
      { id: '32', fieldName: 'gotraFather', label: "Father's Gotra", section: 'student', isVisible: 1, isRequired: 0, categoryScope: 'student', showOnIdCard: 0 },
      { id: '33', fieldName: 'gotraMother', label: "Mother's Gotra", section: 'student', isVisible: 1, isRequired: 0, categoryScope: 'student', showOnIdCard: 0 },
      { id: '34', fieldName: 'gotraGrandmother', label: "Grandmother's Gotra", section: 'student', isVisible: 1, isRequired: 0, categoryScope: 'student', showOnIdCard: 0 },
      { id: '35', fieldName: 'bloodDonationWillingness', label: 'Blood Donation Willingness', section: 'student', isVisible: 1, isRequired: 0, categoryScope: 'student', showOnIdCard: 0 },
      { id: '36', fieldName: 'linkedinProfile', label: 'LinkedIn Profile', section: 'student', isVisible: 1, isRequired: 0, categoryScope: 'student', showOnIdCard: 0 },
      { id: '37', fieldName: 'hobbiesInterests', label: 'Hobbies & Interests', section: 'student', isVisible: 1, isRequired: 0, categoryScope: 'student', showOnIdCard: 0 },
      { id: '38', fieldName: 'futureGoals', label: 'Future Goals', section: 'student', isVisible: 1, isRequired: 0, categoryScope: 'student', showOnIdCard: 0 },

      // Payment Section
      { id: '39', fieldName: 'membershipType', label: 'Membership Type', section: 'payment', isVisible: 1, isRequired: 0, categoryScope: 'doctor,student', showOnIdCard: 1 },
      { id: '40', fieldName: 'paymentReceipt', label: 'Payment Receipt Upload', section: 'payment', isVisible: 1, isRequired: 0, categoryScope: 'doctor,student', showOnIdCard: 0 },

      // Category Visibility
      { id: '41', fieldName: 'category_guest', label: 'Category: Guest/Member', section: 'visibility', isVisible: 1, isRequired: 0, categoryScope: 'all', orderIndex: 1, showOnIdCard: 1 },
      { id: '42', fieldName: 'category_doctor', label: 'Category: Doctor', section: 'visibility', isVisible: 1, isRequired: 0, categoryScope: 'all', orderIndex: 2, showOnIdCard: 1 },
      { id: '43', fieldName: 'category_student', label: 'Category: Student', section: 'visibility', isVisible: 1, isRequired: 0, categoryScope: 'all', orderIndex: 3, showOnIdCard: 1 },
    ];

    // Map other defaults to have an order index based on their ID sequence
    const defaultsWithOrder = defaults.map((d, index) => ({
      ...d,
      orderIndex: d.orderIndex ?? (index + 1) * 10 
    }));

    for (const d of defaultsWithOrder) {
      await db.insert(formConfigs).values(d as any).onConflictDoUpdate({
        target: formConfigs.id,
        set: { orderIndex: d.orderIndex }
      });
    }

    return { success: true, message: 'Initialized successfully' };
  } catch (error: any) {
    console.error('Error initializing form configs:', error);
    return { success: false, message: error.message || 'Failed to initialize' };
  }
}
