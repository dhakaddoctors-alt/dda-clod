'use server';

import { profiles, doctorDetails, studentDetails, profileMetadata, formConfigs } from '@/db/schema';
import { eq, like, or, ne, inArray } from 'drizzle-orm';
import { getDb } from '@/db'; 
import { sql } from 'drizzle-orm';
export async function fetchDirectoryMembers(queryString?: string, filterRole?: string, page: number = 1, limit: number = 20) {
  try {
    const db = getDb();
    const offset = (page - 1) * limit;

    let baseQuery = db.select({
      id: profiles.id,
      name: profiles.fullName,
      category: profiles.category,
      avatarUrl: profiles.avatarUrl,
      customFields: profiles.customFields,
      
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
        ne(sql`LOWER(${profiles.category})`, 'guest')
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
      conditions.push(eq(sql`LOWER(${profiles.category})`, 'doctor'));
    } else if (filterRole === 'student') {
      conditions.push(eq(sql`LOWER(${profiles.category})`, 'student'));
    } else if (filterRole === 'guest') {
      conditions.push(eq(sql`LOWER(${profiles.category})`, 'guest'));
    } else if (filterRole && filterRole !== 'all') {
      // General category match for other values
      conditions.push(eq(sql`LOWER(${profiles.category})`, filterRole.toLowerCase()));
    }

    // 3. Apply WHERE limits safely extracting elements
    let countQuery: any = db.select({ count: sql`count(*)` }).from(profiles)
      .leftJoin(doctorDetails, eq(profiles.id, doctorDetails.profileId))
      .leftJoin(studentDetails, eq(profiles.id, studentDetails.profileId));

    if (conditions.length === 1) {
        baseQuery = baseQuery.where(conditions[0]);
        countQuery = countQuery.where(conditions[0]);
    } else {
        const { and } = await import('drizzle-orm');
        baseQuery = baseQuery.where(and(...conditions)); 
        countQuery = countQuery.where(and(...conditions));
    }

    const totalCountRes = await countQuery;
    const totalCount = Number((totalCountRes[0] as any).count || 0);

    const results = await baseQuery.limit(limit).offset(offset) as any[];
    if (results.length === 0) return { members: [], totalCount: 0, totalPages: 0, currentPage: page };

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
       if (member.customFields) {
          try {
            const json = JSON.parse(member.customFields as string);
            Object.assign(member, json);
          } catch(e) {}
       }
    }
        
    // Optimization: Handle Dynamic Columns in BULK per table
    if (columnFields.length > 0 && memberIds.length > 0) {
        const pCols = columnFields.filter(c => c.section !== 'doctor' && c.section !== 'student').map(c => c.fieldName);
        const dCols = columnFields.filter(c => c.section === 'doctor').map(c => c.fieldName);
        const sCols = columnFields.filter(c => c.section === 'student').map(c => c.fieldName);

        // Map results for easy lookup
        const memberMap = new Map();
        results.forEach(m => memberMap.set(m.id, m));

        // Profile Bulk
        if (pCols.length > 0) {
            const res = await db.run(sql.raw(`SELECT id, ${pCols.join(', ')} FROM profiles WHERE id IN (${memberIds.map(id => `'${id}'`).join(',')})`));
            const rows = (res as any).rows || [];
            rows.forEach((row: any[]) => {
                const m = memberMap.get(row[0]); // ID is always index 0
                if (m) pCols.forEach((col, idx) => m[col] = row[idx + 1]);
            });
        }

        // Doctor Bulk
        if (dCols.length > 0) {
            const res = await db.run(sql.raw(`SELECT profile_id, ${dCols.join(', ')} FROM doctor_details WHERE profile_id IN (${memberIds.map(id => `'${id}'`).join(',')})`));
            const rows = (res as any).rows || [];
            rows.forEach((row: any[]) => {
                const m = memberMap.get(row[0]);
                if (m) dCols.forEach((col, idx) => m[col] = row[idx + 1]);
            });
        }

        // Student Bulk
        if (sCols.length > 0) {
            const res = await db.run(sql.raw(`SELECT profile_id, ${sCols.join(', ')} FROM student_details WHERE profile_id IN (${memberIds.map(id => `'${id}'`).join(',')})`));
            const rows = (res as any).rows || [];
            rows.forEach((row: any[]) => {
                const m = memberMap.get(row[0]);
                if (m) sCols.forEach((col, idx) => m[col] = row[idx + 1]);
            });
        }
    }

    return {
      members: results,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    };

  } catch (error) {
    console.error('Error fetching directory:', error);
    return { members: [], totalCount: 0, totalPages: 0, currentPage: 1 };
  }
}
