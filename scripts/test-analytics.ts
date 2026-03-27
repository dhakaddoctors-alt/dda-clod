import { fetchLiveElectionAnalytics } from '../src/app/actions/nominationActions';
import { fetchActiveElections } from '../src/app/actions/electionActions';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  try {
    const elections = await fetchActiveElections();
    if (elections.length > 0) {
      console.log('Testing analytics for:', elections[0].id);
      const analytics = await fetchLiveElectionAnalytics(elections[0].id);
      console.log('Analytics Result:', analytics);
    }
  } catch (e) {
    console.error('Fatal Script Error:', e);
  }
}
main();
