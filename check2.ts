import { db } from './src/lib/db';
import { agentDecisionsLog } from './src/lib/db/schema';
import { desc } from 'drizzle-orm';

async function run() {
  const res = await db.select({
    id: agentDecisionsLog.id,
    action: agentDecisionsLog.action,
    timestamp: agentDecisionsLog.timestamp
  }).from(agentDecisionsLog).orderBy(desc(agentDecisionsLog.timestamp)).limit(15);
  console.log(res);
  process.exit(0);
}

run();
