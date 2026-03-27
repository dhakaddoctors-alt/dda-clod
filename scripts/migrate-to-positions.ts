import { getDb } from '../src/db/index';
import { elections, electionPosts, candidates, voteTallies, votingRecords } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function migrate() {
    console.log('--- Starting Election Data Migration ---');
    const db = getDb();

    try {
        const allElections = await db.select().from(elections);
        console.log(`Found ${allElections.length} elections to process.`);

        for (const election of allElections) {
            const postId = randomUUID();
            const posName = (election as any).postName || 'General';

            console.log(`Processing Election: ${election.title} | Level: ${election.level} | Post: ${posName}`);

            // 1. Create the position entry
            await db.insert(electionPosts).values({
                id: postId,
                electionId: election.id,
                name: posName,
                status: 'active'
            });

            // 2. Update existing candidates
            const updatedCandidates = await db.update(candidates)
                .set({ postId: postId })
                .where(eq(candidates.electionId, election.id));
            console.log(`  - Linked candidates to new position record.`);

            // 3. Update vote tallies
            await db.update(voteTallies)
                .set({ postId: postId })
                .where(eq(voteTallies.electionId, election.id));
            console.log(`  - Updated vote tallies.`);

            // 4. Update voting records
            await db.update(votingRecords)
                .set({ postId: postId })
                .where(eq(votingRecords.electionId, election.id));
            console.log(`  - Updated voting records.`);
        }

        console.log('--- Migration Completed Successfully ---');
    } catch (error) {
        console.error('Migration Failed:', error);
    }
}

migrate();
