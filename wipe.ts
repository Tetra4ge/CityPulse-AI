import { db } from './src/lib/db';
import { agentDecisionsLog } from './src/lib/db/schema';

async function wipe() {
  await db.delete(agentDecisionsLog).execute();
  console.log('Agent timeline history wiped successfully.');
  process.exit(0);
}

wipe();
