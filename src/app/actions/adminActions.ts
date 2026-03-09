'use server';

import { profiles, doctorDetails, studentDetails } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db';

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
    // Return all users regardless of status
    return await db.select().from(profiles);
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
}

export async function approveUser(profileId: string) {
  try {
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
    const db = getDb();
    
    // Ensure the newRole is one of the allowed ENUM values from the schema
    const allowedRoles = ['guest', 'student', 'doctor', 'editor', 'admin', 'super_admin'];
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

export async function fetchDeletedUsers() {
  try {
    const db = getDb();
    return await db.select().from(profiles).where(eq(profiles.isDeleted, 1));
  } catch (error) {
    console.error('Error fetching deleted users:', error);
    return [];
  }
}

export async function exportMembersToCSV() {
  try {
    const db = getDb();
    const allProfiles = await db.select().from(profiles);
    
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

export async function exportMembersForPDF() {
  try {
    const db = getDb();
    
    // Fetch all records
    const allProfiles = await db.select().from(profiles);
    const allDocs = await db.select().from(doctorDetails);
    const allStudents = await db.select().from(studentDetails);
    
    if (allProfiles.length === 0) return { success: true, data: [] };
    
    const formattedData = allProfiles.map(p => {
      let extraInfo = '';
      
      if (p.role === 'doctor') {
        const doc = allDocs.find(d => d.profileId === p.id);
        if (doc) {
          extraInfo = `${doc.degree || ''} ${doc.specialization ? '- '+doc.specialization : ''}\n${doc.hospitalName || doc.clinicAddress || ''}`;
        }
      } else if (p.role === 'student') {
        const stu = allStudents.find(s => s.profileId === p.id);
        if (stu) {
          extraInfo = `${stu.course || ''} - ${stu.year || ''}\n${stu.college || ''}`;
        }
      }
      
      return {
        id: p.id.substring(0, 8),
        fullName: p.fullName || 'N/A',
        contact: `${p.mobile || 'No Mobile'}\n${p.email || ''}`,
        role: p.role.toUpperCase(),
        professionDetails: extraInfo || 'N/A',
        membership: p.membershipType.toUpperCase(),
        date: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A',
        avatarUrl: p.avatarUrl || null
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
