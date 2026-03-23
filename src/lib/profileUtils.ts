import { getDb } from '@/db';
import { profiles, doctorDetails, studentDetails, profileMetadata, formConfigs } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Fetches a profile and merges all its custom data from JSON, Meta-table, and Dynamic Columns.
 */
export async function getMergedProfileData(profileId: string) {
  try {
    const db = getDb();

    // 1. Fetch Basic Profile
    const profileResults = await db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);
    if (profileResults.length === 0) return null;
    const profile = profileResults[0];

    // 2. Fetch Category Details & Dynamic Columns from that table
    let categoryDetails: any = null;
    const configs = await db.select().from(formConfigs);
    
    // Identify which columns exist in which tables for THIS profile's section
    const columnFields = configs.filter(c => c.storageMode === 'column');

    if (profile.category === 'doctor') {
      const docRaw = await db.select().from(doctorDetails).where(eq(doctorDetails.profileId, profileId)).limit(1);
      categoryDetails = docRaw[0] || {};
      
      // Fetch dynamic columns for doctor_details
      const docCols = columnFields.filter(c => c.section === 'doctor').map(c => c.fieldName);
      if (docCols.length > 0 && categoryDetails.id) {
         const result = await db.run(sql.join([
           sql.raw(`SELECT ${docCols.join(', ')} FROM doctor_details WHERE profile_id = `),
           sql`${profileId}`
         ]));
         // Extract values from result. Use results[0] or rows[0]
         const rawRow = (result as any).rows?.[0] || {};
         // Map values back to categoryDetails. Since it's a proxy, we might need to handle column order.
         // Actually, if we use SELECT * and it's missing from schema, it's safer.
         // Or just use the names we have.
         docCols.forEach((col, idx) => {
           categoryDetails[col] = rawRow[idx];
         });
      }
    } else if (profile.category === 'student') {
      const stuRaw = await db.select().from(studentDetails).where(eq(studentDetails.profileId, profileId)).limit(1);
      categoryDetails = stuRaw[0] || {};
      
      const stuCols = columnFields.filter(c => c.section === 'student').map(c => c.fieldName);
      if (stuCols.length > 0 && categoryDetails.id) {
         const result = await db.run(sql.join([
           sql.raw(`SELECT ${stuCols.join(', ')} FROM student_details WHERE profile_id = `),
           sql`${profileId}`
         ]));
         const rawRow = (result as any).rows?.[0] || {};
         stuCols.forEach((col, idx) => {
           categoryDetails[col] = rawRow[idx];
         });
      }
    }

    // 3. Fetch Dynamic Columns from profiles table
    const profileDynamicCols = columnFields.filter(c => c.section !== 'doctor' && c.section !== 'student').map(c => c.fieldName);
    const mergedProfileData = { ...profile };
    if (profileDynamicCols.length > 0) {
       const result = await db.run(sql.join([
         sql.raw(`SELECT ${profileDynamicCols.join(', ')} FROM profiles WHERE id = `),
         sql`${profileId}`
       ]));
       const rawRow = (result as any).rows?.[0] || {};
       profileDynamicCols.forEach((col, idx) => {
         (mergedProfileData as any)[col] = rawRow[idx];
       });
    }

    // 4. Fetch Meta Table Data
    const metaEntries = await db.select().from(profileMetadata).where(eq(profileMetadata.profileId, profileId));
    const metaData: Record<string, string> = {};
    metaEntries.forEach(m => {
      metaData[m.fieldName] = m.fieldValue;
    });

    // 5. Parse JSON Data
    const jsonData = profile.customFields ? JSON.parse(profile.customFields as string) : {};

    // 6. Final Merge
    // Return a flat structure where all keys are accessible
    // Ensure we don't overwrite the main profile ID and other core fields
    const { id: _, profileId: __, ...safeCategoryDetails } = categoryDetails || {};
    
    return {
      ...mergedProfileData,
      ...safeCategoryDetails,
      ...metaData,
      ...jsonData,
      _original: {
        profile,
        details: categoryDetails,
        meta: metaEntries,
        json: jsonData
      }
    };

  } catch (error) {
    console.error('Error merging profile data:', error);
    return null;
  }
}
