import { getDb } from '../src/db';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const db = getDb();
  
  console.log('--- Testing db.run ---');
  try {
    const resRun = await db.run(sql`SELECT 1 as num, 'test' as str`);
    console.log('run =>', JSON.stringify(resRun));
  } catch (e) {
    console.error('run error', e);
  }

  console.log('--- Testing db.all ---');
  try {
    const resAll = await db.all(sql`SELECT 1 as num, 'test' as str`);
    console.log('all =>', JSON.stringify(resAll));
  } catch (e) {
    console.error('all error', e);
  }

  console.log('--- Testing db.values ---');
  try {
    const resValues = await db.values(sql`SELECT 1 as num, 'test' as str`);
    console.log('values =>', JSON.stringify(resValues));
  } catch (e) {
    console.error('values error', e);
  }
}

main();
