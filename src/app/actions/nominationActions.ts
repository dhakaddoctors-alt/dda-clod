'use server';

import { candidates } from '@/db/schema';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db';
import { uploadToR2 } from '@/lib/storage';

export async function submitNomination(formData: FormData) {
  try {
    const electionId = formData.get('electionId') as string;
    const manifesto = formData.get('manifesto') as string;
    let posterUrl = formData.get('posterUrl') as string || null;
    const posterFile = formData.get('posterFile') as File | null;
    if (posterFile && posterFile.size > 0) {
      posterUrl = await uploadToR2(posterFile);
    }
    
    // In actual implementation, get from NextAuth session
    const candidateProfileId = 'profile_1'; // Mock ID of the logged in user

    if (!electionId || !manifesto) {
      throw new Error('Election ID and Manifesto are required.');
    }

    const db = getDb();
    await db.insert(candidates).values({
      id: randomUUID(),
      electionId,
      profileId: candidateProfileId,
      manifesto,
      posterUrl,
      status: 'pending_approval' // Fixed from pending -> pending_approval
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
        // const db = getDb(process.env as any);
        /* --- REAL DB LOGIC ---
        // Fetch candidates and their vote counts
        const results = await db.select({
            candidateId: candidates.id,
            name: profiles.fullName,
            votes: voteTallies.count
        })
        .from(candidates)
        .leftJoin(voteTallies, eq(candidates.id, voteTallies.candidateId))
        .leftJoin(profiles, eq(candidates.profileId, profiles.id))
        .where(eq(candidates.electionId, electionId));

        // Fetch total votes cast
        const totalVotesQuery = await db.select({ count: sql`count(*)` }).from(votingRecords).where(eq(votingRecords.electionId, electionId));
        const totalVotes = totalVotesQuery[0].count;
        */

        // --- MOCK LOGIC ---
        return {
           totalVotesCast: 1250,
           totalEligibleVoters: 4209,
           participationRate: '29.7%',
           candidates: [
              { id: 'candidate_1', name: 'Dr. Ramesh Kumar', votes: 850, percentage: 68 },
              { id: 'candidate_2', name: 'Dr. Suresh Dhakad', votes: 400, percentage: 32 }
           ]
        };
    } catch (error) {
        console.error('Analytics Error:', error);
        return null;
    }
}
