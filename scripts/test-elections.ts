import { fetchActiveElections } from '../src/app/actions/electionActions';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  try {
    console.log('Fetching elections...');
    const result = await fetchActiveElections();
    console.log('Success:', result);
  } catch (e) {
    console.error('Fatal Script Error:', e);
  }
}
main();
