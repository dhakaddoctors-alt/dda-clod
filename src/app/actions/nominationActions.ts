'use server';

import { candidates, elections, profiles, voteTallies, votingRecords } from '@/db/schema';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db';
import { eq, sql } from 'drizzle-orm';
import { uploadToR2 } from '@/lib/storage';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function submitNomination(formData: FormData) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.id) {
      throw new Error('You must be logged in to submit a nomination.');
    }

    const electionId = formData.get('electionId') as string;
    const manifesto = formData.get('manifesto') as string;
    let posterUrl = formData.get('posterUrl') as string || null;
    const posterFile = formData.get('posterFile') as File | null;
    if (posterFile && posterFile.size > 0) {
      posterUrl = await uploadToR2(posterFile);
    }
    
    const candidateProfileId = session.user.id;

    if (!electionId || !manifesto) {
      throw new Error('Election ID and Manifesto are required.');
    }

    // === GEOGRAPHY ELIGIBILITY CHECK ===
    const db = getDb();
    const electionRows = await db.select().from(elections).where(eq(elections.id, electionId)).limit(1);
    if (electionRows.length === 0) throw new Error('Election not found.');
    const election = electionRows[0];

    const userState = session.user.state as string | null;
    const userDistrict = session.user.district as string | null;

    if (election.level === 'state') {
      if (!userState || userState.toLowerCase() !== (election.locationName || '').toLowerCase()) {
        throw new Error(`Only residents of ${election.locationName} can nominate for this state election.`);
      }
    } else if (election.level === 'district') {
      if (!userDistrict || userDistrict.toLowerCase() !== (election.locationName || '').toLowerCase()) {
        throw new Error(`Only residents of ${election.locationName} district can nominate for this election.`);
      }
    }
    // National elections: open to all

    await db.insert(candidates).values({
      id: randomUUID(),
      electionId,
      profileId: candidateProfileId,
      manifesto,
      posterUrl,
      status: 'pending_approval'
    });

    console.log(`[DB] Submitted nomination for ${candidateProfileId} in election ${electionId}`);
    return { success: true, message: 'Nomination submitted successfully. Pending Admin approval.' };
  } catch (error: any) {
    console.error('Error submitting nomination:', error);
    return { success: false, message: error.message || 'Failed to submit nomination.' };
  }
}

export async function fetchLiveElectionAnalytics(electionId: string) {
    try {
        const db = getDb();
        
        // 1. Fetch total eligible voters (All verified profiles)
        const totalVotersQuery = await db.select({ count: sql<number>`count(*)` })
          .from(profiles).where(eq(profiles.paymentStatus, 'verified'));
        const totalEligibleVoters = Number(totalVotersQuery[0]?.count || 0);

        // 2. Fetch total votes cast in this election
        const totalVotesQuery = await db.select({ count: sql<number>`count(*)` })
          .from(votingRecords).where(eq(votingRecords.electionId, electionId));
        const totalVotesCast = Number(totalVotesQuery[0]?.count || 0);

        const participationRate = totalEligibleVoters > 0 
           ? ((totalVotesCast / totalEligibleVoters) * 100).toFixed(1) + '%' 
           : '0%';

        // 3. Fetch candidates and their actual vote counts
        const results = await db.select({
            id: candidates.id,
            name: profiles.fullName,
            votes: voteTallies.count
        })
        .from(candidates)
        .leftJoin(voteTallies, eq(candidates.id, voteTallies.candidateId))
        .innerJoin(profiles, eq(candidates.profileId, profiles.id))
        .where(eq(candidates.electionId, electionId));

        const candidatesMapped = results.map(c => {
            const votes = c.votes || 0;
            const percentage = totalVotesCast > 0 ? Math.round((votes / totalVotesCast) * 100) : 0;
            return {
                id: c.id,
                name: c.name,
                votes,
                percentage
            };
        });

        return {
           totalVotesCast,
           totalEligibleVoters,
           participationRate,
           candidates: candidatesMapped
        };
    } catch (error) {
        console.error('Analytics Error:', error);
        return null;
    }
}
