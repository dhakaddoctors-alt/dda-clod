import { getDb } from '../src/db';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const db = getDb();
  try {
    const cfgs = await db.all(sql`SELECT * FROM form_configs WHERE storage_mode = 'column'`);
    console.log('Column fields in form_configs:', cfgs);
  } catch (e) {
    console.error(e);
  }
}
main();
