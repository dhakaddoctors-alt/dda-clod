import 'dotenv/config';
import { getDb } from '../src/db';
import { advertisements } from '../src/db/schema';
import { sql } from 'drizzle-orm';

async function verify() {
  console.log('--- DB Verification ---');
  const db = getDb();
  try {
    const result = await db.run(sql`SELECT name FROM sqlite_master WHERE type='table' AND name='advertisements'`);
    console.log('Table "advertisements" exists:', (result as any).rows.length > 0);
    
    const columns = await db.run(sql`PRAGMA table_info(advertisements)`);
    console.log('Columns:', (columns as any).rows);
  } catch (e) {
    console.error('Verification failed:', e);
  }
}

verify();
