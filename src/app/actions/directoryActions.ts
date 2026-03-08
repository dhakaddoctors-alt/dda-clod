'use server';

import { profiles, doctorDetails, studentDetails } from '@/db/schema';
import { eq, like, or, ne } from 'drizzle-orm';
import { getDb } from '@/db'; 

export async function fetchDirectoryMembers(queryString?: string, filterRole?: string) {
  try {
    const db = getDb();

    let baseQuery = db.select({
      id: profiles.id,
      name: profiles.fullName,
      role: profiles.role,
      avatarUrl: profiles.avatarUrl,
      
      // Doctor fields
      specialty: doctorDetails.specialization,
      experience: doctorDetails.experience,
      clinicAddress: doctorDetails.clinicAddress,
      
      // Student fields
      college: studentDetails.college,
      course: studentDetails.course,
      
      // Guest fields
      occupation: profiles.occupation,
    })
    .from(profiles)
    .leftJoin(doctorDetails, eq(profiles.id, doctorDetails.profileId))
    .leftJoin(studentDetails, eq(profiles.id, studentDetails.profileId))
    .$dynamic();

    // Base conditions: exclude soft-deleted and unverified accounts
    const conditions: any[] = [
        eq(profiles.isDeleted, 0),
        eq(profiles.paymentStatus, 'verified'),
        ne(profiles.role, 'super_admin')
    ];

    // 1. Keyword search (NLP basic LIKE implementation)
    if (queryString) {
      const q = `%${queryString}%`;
      conditions.push(
        or(
          like(profiles.fullName, q),
          like(doctorDetails.specialization, q),
          like(doctorDetails.clinicAddress, q),
          like(studentDetails.college, q),
          like(profiles.occupation, q)
        )
      );
    }

    // 2. Role filters
    if (filterRole && filterRole !== 'all') {
      conditions.push(eq(profiles.role, filterRole));
    }

    // 3. Apply WHERE limits safely extracting elements
    if (conditions.length === 1) {
        baseQuery = baseQuery.where(conditions[0]);
    } else {
        // Use an AND clause requiring all pushed constraints to be met together
        // e.g., (isDeleted == 0 AND paymentStatus == 'verified' AND role == filterRole AND (search conditions))
        const { and } = await import('drizzle-orm');
        baseQuery = baseQuery.where(and(...conditions)); 
    }

    const results = await baseQuery.limit(50);
    return results;

  } catch (error) {
    console.error('Error fetching directory:', error);
    return [];
  }
}
