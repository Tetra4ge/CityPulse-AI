import { db } from './src/lib/db';
import { agentDecisionsLog } from './src/lib/db/schema';
import { sql } from 'drizzle-orm';

async function run() {
  const res = await db.select({
    action: agentDecisionsLog.action,
    count: sql`count(*)`
  }).from(agentDecisionsLog).groupBy(agentDecisionsLog.action).orderBy(sql`count(*) DESC`).limit(10);
  console.log(res);
  process.exit(0);
}

run();
