import { initializeFormConfigs } from '../src/app/actions/formActions';

async function main() {
  console.log('Initializing form configs...');
  const res = await initializeFormConfigs();
  console.log('Result:', res);
}

main().catch(console.error);
