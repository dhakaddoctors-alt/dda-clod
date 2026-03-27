import { adminFetchAllCandidates, fetchActiveElections } from '../src/app/actions/electionActions';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  try {
    const elections = await fetchActiveElections();
    if (elections.length > 0) {
      console.log('Testing candidates for:', elections[0].id);
      const candidates = await adminFetchAllCandidates(elections[0].id);
      console.log('Candidates length:', candidates.length);
    }
  } catch (e) {
    console.error('Fatal Script Error:', e);
  }
}
main();
