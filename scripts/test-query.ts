import { getDb } from '../src/db';
import { formConfigs } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const db = getDb();
  console.log('Fetching form configs...');
  const configs = await db.select().from(formConfigs).where(eq(formConfigs.fieldName, 'upiQrDetails'));
  console.log('Configs for upiQrDetails:', JSON.stringify(configs, null, 2));
}

main().catch(console.error);
