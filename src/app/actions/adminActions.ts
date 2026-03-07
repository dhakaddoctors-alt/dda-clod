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
    const allProfiles = await db.select().from(profiles);
    
    if (allProfiles.length === 0) return { success: true, data: [] };
    
    const tableData = allProfiles.map(r => ({
      id: r.id.substring(0, 8),
      fullName: r.fullName || 'N/A',
      contact: `${r.mobile || 'No Mobile'}\n${r.email || 'No Email'}`,
      role: r.role.toUpperCase(),
      membership: r.membershipType.toUpperCase(),
      status: r.paymentStatus.toUpperCase(),
      date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'N/A'
    }));
    
    return { success: true, data: tableData };
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
