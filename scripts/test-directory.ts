import { fetchDirectoryMembers } from '../src/app/actions/directoryActions';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  try {
    const result = await fetchDirectoryMembers();
    console.log('Total members:', result.totalCount);
    if (result.members.length > 0) {
      console.log('First member:', JSON.stringify(result.members[0], null, 2));
    }
  } catch (e) {
    console.error(e);
  }
}
main();
