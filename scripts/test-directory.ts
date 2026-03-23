import { fetchDirectoryMembers } from '../src/app/actions/directoryActions';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  try {
    const mems = await fetchDirectoryMembers();
    console.log('Total members:', mems.length);
    if (mems.length > 0) {
      console.log('First member:', JSON.stringify(mems[0], null, 2));
    }
  } catch (e) {
    console.error(e);
  }
}
main();
