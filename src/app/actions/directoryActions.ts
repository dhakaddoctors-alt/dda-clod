'use server';

import { profiles, doctorDetails, studentDetails, profileMetadata, formConfigs } from '@/db/schema';
import { eq, like, or, ne, inArray } from 'drizzle-orm';
import { getDb } from '@/db'; 
import { sql } from 'drizzle-orm';
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
      hospitalName: doctorDetails.hospitalName,
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

    const results = await baseQuery.limit(50) as any[];
    if (results.length === 0) return [];

    const memberIds = results.map(r => r.id);
    const configs = await db.select().from(formConfigs);
    const directoryConfigs = configs.filter(c => c.showInDirectory === 1 && c.isVisible === 1);

    // 4. Fetch Meta Table Data in bulk
    const metaEntries = await db.select()
      .from(profileMetadata)
      .where(inArray(profileMetadata.profileId, memberIds));

    // 5. Fetch Dynamic Columns if any are marked for directory
    const columnFields = directoryConfigs.filter(c => c.storageMode === 'column');
    
    // We'll update the result objects with extra data
    for (const member of results) {
       // Append Meta
       const memberMeta = metaEntries.filter(m => m.profileId === member.id);
       memberMeta.forEach(m => {
          member[m.fieldName] = m.fieldValue;
       });

       // Append JSON
       const profileRaw = await db.select({ customFields: profiles.customFields })
         .from(profiles)
         .where(eq(profiles.id, member.id))
         .limit(1);
       if (profileRaw[0]?.customFields) {
          try {
            const json = JSON.parse(profileRaw[0].customFields as string);
            Object.assign(member, json);
          } catch(e) {}
       }
       
        // Handle Dynamic Columns (Fetch based on section)
        if (columnFields.length > 0) {
           const pCols = columnFields.filter(c => c.section !== 'doctor' && c.section !== 'student').map(c => c.fieldName);
           if (pCols.length > 0) {
              const res = await db.run(sql.raw(`SELECT ${pCols.join(', ')} FROM profiles WHERE id = '${member.id}'`));
              const row = (res as any).rows?.[0] || [];
              pCols.forEach((col, idx) => member[col] = row[idx]);
           }

           if (member.category === 'doctor') {
             const dCols = columnFields.filter(c => c.section === 'doctor').map(c => c.fieldName);
             if (dCols.length > 0) {
                const res = await db.run(sql.raw(`SELECT ${dCols.join(', ')} FROM doctor_details WHERE profile_id = '${member.id}'`));
                const row = (res as any).rows?.[0] || [];
                dCols.forEach((col, idx) => member[col] = row[idx]);
             }
           }

           if (member.category === 'student') {
             const sCols = columnFields.filter(c => c.section === 'student').map(c => c.fieldName);
             if (sCols.length > 0) {
                const res = await db.run(sql.raw(`SELECT ${sCols.join(', ')} FROM student_details WHERE profile_id = '${member.id}'`));
                const row = (res as any).rows?.[0] || [];
                sCols.forEach((col, idx) => member[col] = row[idx]);
             }
           }
        }
    }

    return results;

  } catch (error) {
    console.error('Error fetching directory:', error);
    return [];
  }
}
