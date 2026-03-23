import { getDb } from '../src/db';
import { getMergedProfileData } from '../src/lib/profileUtils';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const db = getDb();
  const profilesResult = await db.all(sql`SELECT id FROM profiles LIMIT 1`);
  const profileId = (profilesResult as any)[0]?.[0] || Object.values((profilesResult as any)[0] || {})[0];
  
  if (!profileId) {
    console.log('No profiles found');
    return;
  }
  
  console.log('Testing profileId:', profileId);
  const data = await getMergedProfileData(profileId);
  console.log('Result:', JSON.stringify(data, null, 2));
}

main();
