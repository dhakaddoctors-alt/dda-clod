'use server';

import { profiles, doctorDetails, studentDetails } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

async function checkAdminAccess() {
  const session = await getServerSession(authOptions) as any;
  if (!session) return false;
  const role = session.user.role;
  return role === 'admin' || role === 'super_admin' || role === 'editor';
}

async function checkStrictAdminAccess() {
  const session = await getServerSession(authOptions) as any;
  if (!session) return false;
  const role = session.user.role;
  return role === 'admin' || role === 'super_admin';
}

export async function fetchPendingApprovals() {
  try {
    const db = getDb();
    return await db.select().from(profiles).where(eq(profiles.paymentStatus, 'pending'));
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    return [];
  }
}

export async function fetchAllUsersForAdmin() {
  try {
    const db = getDb();
    // Return all users regardless of status, with professional details joined for filtering
    const results = await db.select({
      id: profiles.id,
      fullName: profiles.fullName,
      email: profiles.email,
      mobile: profiles.mobile,
      role: profiles.role,
      category: profiles.category,
      paymentStatus: profiles.paymentStatus,
      paymentReceiptUrl: profiles.paymentReceiptUrl,
      isDeleted: profiles.isDeleted,
      createdAt: profiles.createdAt,
      // NOTE: We avoid selecting doctorDetails.id or studentDetails.id here
      // because duplicate column names ('id') cause mapping shifts in the D1 HTTP API.
    })
    .from(profiles)
    .leftJoin(doctorDetails, eq(profiles.id, doctorDetails.profileId))
    .leftJoin(studentDetails, eq(profiles.id, studentDetails.profileId));

    return results;
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
}

export async function approveUser(profileId: string) {
  try {
    if (!await checkAdminAccess()) throw new Error('Unauthorized');
    const db = getDb();

    await db.update(profiles)
      .set({ paymentStatus: 'verified' })
      .where(eq(profiles.id, profileId));

    console.log(`[DB] Approved user: ${profileId}`);
    
    // Revalidate the admin dashboard so the list updates automatically
    revalidatePath('/admin');
    return { success: true, message: 'User approved successfully.' };
  } catch (error: any) {
    console.error('Error approving user:', error);
    return { success: false, message: error.message || 'Failed to approve user.' };
  }
}

export async function rejectUser(profileId: string) {
  try {
    if (!await checkAdminAccess()) throw new Error('Unauthorized');
    const db = getDb();

    await db.update(profiles)
      .set({ paymentStatus: 'rejected' })
      .where(eq(profiles.id, profileId));

    console.log(`[DB] Rejected user: ${profileId}`);
    revalidatePath('/admin');
    return { success: true, message: 'User rejected.' };
  } catch(error: any) {
    return { success: false, message: error.message || 'Failed to reject user.' };
  }
}

export async function softDeleteUser(profileId: string) {
  try {
    if (!await checkAdminAccess()) throw new Error('Unauthorized');
    const db = getDb();
    
    await db.update(profiles)
      .set({ isDeleted: 1 })
      .where(eq(profiles.id, profileId));

    console.log(`[DB] Soft deleted user: ${profileId}`);
    revalidatePath('/admin');
    revalidatePath('/directory');
    return { success: true, message: 'User deleted safely.' };
  } catch(error: any) {
    return { success: false, message: error.message || 'Failed to delete user.' };
  }
}

export async function restoreUser(profileId: string) {
  try {
    if (!await checkAdminAccess()) throw new Error('Unauthorized');
    const db = getDb();
    
    await db.update(profiles)
      .set({ isDeleted: 0 })
      .where(eq(profiles.id, profileId));

    console.log(`[DB] Restored user: ${profileId}`);
    revalidatePath('/admin');
    revalidatePath('/directory');
    return { success: true, message: 'User restored successfully.' };
  } catch(error: any) {
    return { success: false, message: error.message || 'Failed to restore user.' };
  }
}

export async function changeUserRole(profileId: string, newRole: string) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session) throw new Error('Unauthorized');
    
    // Changing administrative roles should probably be limited to super_admin or admin
    if (session.user.role !== 'admin' && session.user.role !== 'super_admin') {
       throw new Error('Only Admins can change user roles.');
    }

    const db = getDb();
    
    // Ensure the newRole is one of the allowed admin ENUM values
    const allowedRoles = ['member', 'editor', 'admin', 'super_admin'];
    if (!allowedRoles.includes(newRole)) {
      throw new Error('Invalid role specified.');
    }

    await db.update(profiles)
      .set({ role: newRole })
      .where(eq(profiles.id, profileId));

    console.log(`[DB] Changed user role: ${profileId} to ${newRole}`);
    revalidatePath('/admin');
    revalidatePath('/directory');
    revalidatePath(`/directory/${profileId}`);
    return { success: true, message: `User role updated to ${newRole}.` };
  } catch(error: any) {
    return { success: false, message: error.message || 'Failed to update user role.' };
  }
}

export async function changeUserCategory(profileId: string, newCategory: string) {
  try {
    if (!await checkStrictAdminAccess()) throw new Error('Unauthorized: Only Admins can change identity categories.');
    const db = getDb();
    
    // Ensure the newCategory is one of the allowed professional labels
    const allowedCategories = ['guest', 'student', 'doctor'];
    if (!allowedCategories.includes(newCategory)) {
      throw new Error('Invalid category specified.');
    }

    await db.update(profiles)
      .set({ category: newCategory })
      .where(eq(profiles.id, profileId));

    console.log(`[DB] Changed user category: ${profileId} to ${newCategory}`);
    revalidatePath('/admin');
    revalidatePath('/directory');
    revalidatePath(`/directory/${profileId}`);
    return { success: true, message: `User identity category updated to ${newCategory}.` };
  } catch(error: any) {
    return { success: false, message: error.message || 'Failed to update user category.' };
  }
}

export async function fetchDeletedUsers() {
  try {
    const db = getDb();
    return await db.select().from(profiles).where(eq(profiles.isDeleted, 1));
  } catch (error) {
    console.error('Error fetching deleted users:', error);
    return [];
  }
}

export async function exportMembersToCSV(profileIds?: string[]) {
  try {
    const db = getDb();
    
    // Fetch records
    let profilesQuery = db.select().from(profiles);
    
    // If specific IDs are provided, filter by them
    const allProfiles = profileIds && profileIds.length > 0
      ? await profilesQuery.where(inArray(profiles.id, profileIds))
      : await profilesQuery;
    
    if (allProfiles.length === 0) return { success: true, csv: '' };
    
    const headers = ['ID', 'Full Name', 'Email', 'Mobile', 'Role', 'Membership Type', 'Payment Status', 'Created At'];
    
    const csvRows = allProfiles.map(r => {
      return [
        r.id,
        `"${r.fullName || ''}"`,
        `"${r.email || ''}"`,
        `"${r.mobile || ''}"`,
        r.role,
        r.membershipType,
        r.paymentStatus,
        r.createdAt ? new Date(r.createdAt).toISOString() : ''
      ].join(',');
    });
    
    const csvString = [headers.join(','), ...csvRows].join('\n');
    return { success: true, csv: csvString };
  } catch (error: any) {
    console.error('Error exporting CSV:', error);
    return { success: false, message: error.message || 'Failed to export to CSV' };
  }
}

export async function exportMembersForPDF(profileIds?: string[]) {
  try {
    const db = getDb();
    
    let profilesQuery = db.select().from(profiles);
    const allProfiles = profileIds && profileIds.length > 0
      ? await profilesQuery.where(inArray(profiles.id, profileIds))
      : await profilesQuery;
      
    const allDocs = await db.select().from(doctorDetails);
    const allStudents = await db.select().from(studentDetails);
    
    if (allProfiles.length === 0) return { success: true, data: [] };
    
    const formattedData = allProfiles.map(p => {
      const doc = allDocs.find(d => d.profileId === p.id);
      const stu = allStudents.find(s => s.profileId === p.id);

      return {
        // Base Profile
        id: p.id,
        shortId: p.id.substring(0, 8),
        fullName: p.fullName || '',
        fatherName: p.fatherName || '',
        email: p.email || '',
        mobile: p.mobile || '',
        gender: p.gender || '',
        maritalStatus: p.maritalStatus || '',
        dob: p.dob ? new Date(p.dob).toLocaleDateString('en-IN') : '',
        bloodGroup: p.bloodGroup || '',
        state: p.state || '',
        district: p.district || '',
        occupation: p.occupation || '',
        category: p.category || '',
        role: p.role || '',
        membershipType: p.membershipType || '',
        paymentStatus: p.paymentStatus || '',
        avatarUrl: p.avatarUrl || null,
        createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : '',
        // Doctor fields
        degree: doc?.degree || '',
        specialization: doc?.specialization || '',
        hospitalName: doc?.hospitalName || '',
        presentWorkingPlace: doc?.presentWorkingPlace || '',
        registrationNo: doc?.registrationNo || '',
        experience: doc?.experience != null ? String(doc.experience) : '',
        clinicAddress: doc?.clinicAddress || '',
        consultationFee: doc?.consultationFee != null ? String(doc.consultationFee) : '',
        availabilityTimings: doc?.availabilityTimings || '',
        memberships: doc?.memberships || '',
        awards: doc?.awards || '',
        websiteSocialLinks: doc?.websiteSocialLinks || '',
        // Student fields
        college: stu?.college || '',
        university: stu?.university || '',
        course: stu?.course || '',
        year: stu?.year || '',
        collegeEntryYear: stu?.collegeEntryYear != null ? String(stu.collegeEntryYear) : '',
        gotraFather: stu?.gotraFather || '',
        gotraMother: stu?.gotraMother || '',
        gotraGrandmother: stu?.gotraGrandmother || '',
        futureGoals: stu?.futureGoals || '',
        internshipStatus: stu?.internshipStatus || '',
        hobbiesInterests: stu?.hobbiesInterests || '',
        linkedinProfile: stu?.linkedinProfile || '',
        bloodDonationWillingness: stu?.bloodDonationWillingness || '',
      };
    });
    
    return { success: true, data: formattedData };
  } catch (error: any) {
    console.error('Error fetching data for PDF:', error);
    return { success: false, message: error.message || 'Failed to fetch data for PDF' };
  }
}

export async function exportDatabaseSnapshot() {
  try {
    const db = getDb();
    
    // Fetch critical tables
    const allProfiles = await db.select().from(profiles);
    const allDoctorDetails = await db.select().from(doctorDetails);
    const allStudentDetails = await db.select().from(studentDetails);
    
    const snapshot = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        profiles: allProfiles,
        doctorDetails: allDoctorDetails,
        studentDetails: allStudentDetails
      }
    };
    
    return { success: true, snapshot: JSON.stringify(snapshot, null, 2) };
  } catch (error: any) {
    console.error('Error generating database snapshot:', error);
    return { success: false, message: error.message || 'Failed to generate database snapshot' };
  }
}
