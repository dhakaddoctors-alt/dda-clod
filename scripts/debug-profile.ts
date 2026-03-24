import { getMergedProfileData } from '../src/lib/profileUtils';
import { getDb } from '../src/db';
import { profiles } from '../src/db/schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function debug() {
  const db = getDb();
  const allProfiles = await db.select().from(profiles).limit(5);
  
  if (allProfiles.length === 0) {
    console.log('No profiles found in DB.');
    return;
  }

  for (const p of allProfiles) {
    console.log(`\n--- Debugging Profile: ${p.fullName} (${p.id}) [${p.category}] ---`);
    const merged = await getMergedProfileData(p.id);
    if (!merged) {
      console.log('Failed to fetch merged data.');
      continue;
    }

    console.log('Flattened Keys:', Object.keys(merged).filter(k => k !== '_original'));
    console.log('Has details property?', 'details' in merged);
    if (merged._original) {
      console.log('Original details keys:', Object.keys(merged._original.details || {}));
    }
    
    // Check specific fields that user says are missing
    if (p.category === 'doctor') {
      console.log('Specialization:', (merged as any).specialization);
      console.log('Hospital:', (merged as any).hospitalName);
    } else if (p.category === 'student') {
      console.log('College:', (merged as any).college);
    }
  }
}

debug().catch(console.error);
