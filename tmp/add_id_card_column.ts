import { getDb } from '../src/db';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function main() {
  const db = getDb();
  console.log('Adding show_on_id_card column to form_configs...');
  
  try {
    await db.run(sql.raw('ALTER TABLE form_configs ADD COLUMN show_on_id_card INTEGER DEFAULT 0'));
    console.log('Column added successfully');
    
    // Set some sensible defaults
    console.log('Setting defaults for ID card fields...');
    await db.run(sql.raw(`
      UPDATE form_configs 
      SET show_on_id_card = 1 
      WHERE field_name IN ('fullName', 'bloodGroup', 'membershipType', 'category')
    `));
    console.log('Defaults set successfully');
    
  } catch (error: any) {
    console.error('Operation failed:', error.message);
    if (error.message.includes('duplicate column name')) {
        console.log('Column already exists, proceeding to set defaults...');
        try {
            await db.run(sql.raw(`
              UPDATE form_configs 
              SET show_on_id_card = 1 
              WHERE field_name IN ('fullName', 'bloodGroup', 'membershipType', 'category')
            `));
            console.log('Defaults set successfully');
        } catch (e: any) {
             console.error('Failed to set defaults:', e.message);
        }
    } else {
        process.exit(1);
    }
  }
}

main();
