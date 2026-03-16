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
      category: profiles.category,
      avatarUrl: profiles.avatarUrl,
      
      // Doctor fields
      specialty: doctorDetails.specialization,
      experience: doctorDetails.experience,
      clinicAddress: doctorDetails.clinicAddress,
      
      // Student fields
      college: studentDetails.college,
      course: studentDetails.course,
    })
    .from(profiles)
    .leftJoin(doctorDetails, eq(profiles.id, doctorDetails.profileId))
    .leftJoin(studentDetails, eq(profiles.id, studentDetails.profileId))
    .$dynamic();

    // Base conditions: exclude soft-deleted, unverified, and GUESTS
    const conditions: any[] = [
        eq(profiles.isDeleted, 0),
        eq(profiles.paymentStatus, 'verified'),
        ne(profiles.category, 'guest')
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

    // 2. Category filters (Professional Identity)
    if (filterRole === 'doctor') {
      conditions.push(eq(profiles.category, 'doctor'));
    } else if (filterRole === 'student') {
      conditions.push(eq(profiles.category, 'student'));
    } else if (filterRole === 'guest') {
      conditions.push(eq(profiles.category, 'guest'));
    } else if (filterRole && filterRole !== 'all') {
      // General category match for other values
      conditions.push(eq(profiles.category, filterRole));
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
