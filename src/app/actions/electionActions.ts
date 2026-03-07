'use server';

import { elections, candidates, voteTallies, votingRecords, profiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
// import { getDb } from '@/db';

export async function fetchActiveElections() {
  try {
    // const db = getDb(process.env as any);
    /* REAL D1 QUERY
    const activeElections = await db.select()
      .from(elections)
      .where(eq(elections.status, 'active'));
    */

    return [
      {
         id: 'election_1',
         title: 'National President Election 2026-2028',
         description: 'Select the next National President to lead the Dhakad Doctors Association into the digital era.',
         status: 'active',
         endDate: new Date(Date.now() + 86400000 * 5) // 5 days from now
      }
    ];
  } catch (error) {
    console.error('Error fetching elections:', error);
    return [];
  }
}

export async function fetchCandidates(electionId: string) {
  try {
     // const db = getDb(process.env as any);
     /*
     const electionCandidates = await db.select({
        id: candidates.id,
        manifesto: candidates.manifesto,
        posterUrl: candidates.posterUrl,
        name: profiles.fullName,
        designation: doctorDetails.specialization, // or existing role
        avatarUrl: profiles.avatarUrl
     })
     .from(candidates)
     .innerJoin(profiles, eq(candidates.profileId, profiles.id))
     .where(and(eq(candidates.electionId, electionId), eq(candidates.status, 'approved')));
     return electionCandidates;
     */

     // Mock Approved Candidates
     return [
       {
         id: 'candidate_1',
         name: 'Dr. Ramesh Kumar',
         designation: 'Senior Cardiologist | Jaipur',
         manifesto: 'My vision is to connect every Dhakad medical professional under one digital roof and establish regular free medical camps in rural areas.',
         posterUrl: 'https://images.unsplash.com/photo-1551076805-e166946bc9eb?q=80&w=2699&auto=format&fit=crop',
         avatarUrl: 'https://via.placeholder.com/150'
       },
       {
         id: 'candidate_2',
         name: 'Dr. Suresh Dhakad',
         designation: 'Orthopedic Surgeon | Indore',
         manifesto: 'I pledge to create a robust student mentorship program and increase our association\'s fund for members in medical emergencies by 200%.',
         posterUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop',
         avatarUrl: 'https://via.placeholder.com/150'
       }
     ];
  } catch(error) {
    console.error('Error fetching candidates:', error);
    return [];
  }
}

export async function castVote(formData: FormData) {
  try {
    const electionId = formData.get('electionId') as string;
    const candidateId = formData.get('candidateId') as string;
    
    // In actual implementation, get from NextAuth session
    // const session = await getServerSession(authOptions);
    // const voterId = session.user.id;
    const voterId = 'test_voter_123'; 

    if (!electionId || !candidateId) {
       throw new Error('Missing voting information.');
    }

    // const db = getDb(process.env as any);

    /* --- REAL 1-PERSON-1-VOTE LOGIC ---
    
    // 1. Verify if user already voted
    const existingVote = await db.select()
      .from(votingRecords)
      .where(and(eq(votingRecords.electionId, electionId), eq(votingRecords.profileId, voterId)))
      .limit(1);

    if (existingVote.length > 0) {
      throw new Error('You have already casted your vote in this election.');
    }

    // 2. Wrap in a Transaction to ensure consistency
    await db.transaction(async (tx) => {
       // Anonymous Ballot: Increment the candidate's count without linking voter to candidate
       
       // a) Check if tally exists
       const tally = await tx.select().from(voteTallies).where(eq(voteTallies.candidateId, candidateId)).limit(1);
       if (tally.length > 0) {
          // Increment
          await tx.update(voteTallies)
                  .set({ count: tally[0].count + 1 })
                  .where(eq(voteTallies.id, tally[0].id));
       } else {
          // Create Tally
          await tx.insert(voteTallies).values({
            id: randomUUID(),
            candidateId,
            electionId,
            count: 1
          });
       }

       // b) Record the fact that user HAS voted (to prevent double voting)
       await tx.insert(votingRecords).values({
         id: randomUUID(),
         electionId,
         profileId: voterId,
         votedAt: new Date()
       });
    });

    */

    console.log(`[MOCK] Recorded secure vote for candidate: ${candidateId} in election: ${electionId}`);
    return { success: true, message: 'Your vote has been securely and anonymously recorded!' };

  } catch(error: any) {
    return { success: false, message: error.message || 'Failed to submit vote.' };
  }
}
