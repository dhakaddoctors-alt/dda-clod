'use server';

import { elections, candidates, doctorDetails, voteTallies, votingRecords, profiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getDb } from '@/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';

export async function fetchActiveElections() {
  try {
    const db = getDb();
    // Return all elections
    let activeElections = await db.select().from(elections);

    // Auto-create default National Election if the table is completely empty
    if (activeElections.length === 0) {
       await db.insert(elections).values({
          id: 'election_1',
          title: 'National President Election',
          description: 'Select the next National President to lead the Dhakad Doctors Association.',
          level: 'national',
          status: 'upcoming',
       });
       activeElections = await db.select().from(elections);
    }

    return activeElections;
  } catch (error) {
    console.error('Error fetching elections:', error);
    return [];
  }
}

export async function createNewElection(formData: FormData) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
      throw new Error('Unauthorized');
    }

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const level = formData.get('level') as 'national' | 'state' | 'district';
    const locationName = formData.get('locationName') as string || null;

    if (!title) throw new Error('Election Title is required.');

    const db = getDb();
    const newElectionId = `election_${randomUUID()}`;

    await db.insert(elections).values({
       id: newElectionId,
       title,
       description,
       level,
       locationName: level === 'national' ? null : locationName,
       status: 'upcoming'
    });

    revalidatePath('/admin');
    revalidatePath('/elections');

    return { success: true, message: 'New election created successfully.' };
  } catch (error: any) {
    console.error('Error creating election:', error);
    return { success: false, message: error.message || 'Failed to create election.' };
  }
}

export async function updateElectionSchedule(
  electionId: string, 
  config: { nominationStartDate: Date | null, nominationEndDate: Date | null, startDate: Date | null, endDate: Date | null }
) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
      throw new Error('Unauthorized');
    }

    const { nominationStartDate, nominationEndDate, startDate, endDate } = config;
    const db = getDb();

    // Determine status automatically based on dates
    const now = new Date();
    let status = 'upcoming';
    if (startDate && startDate <= now && (!endDate || endDate > now)) {
       status = 'active';
    } else if (endDate && endDate < now) {
       status = 'completed';
    }

    await db.update(elections)
      .set({
         nominationStartDate,
         nominationEndDate,
         startDate,
         endDate,
         status
      })
      .where(eq(elections.id, electionId));

    revalidatePath('/admin');
    revalidatePath('/elections');
    revalidatePath('/elections/nominate');

    return { success: true, message: 'Election schedule updated successfully.' };
  } catch (error: any) {
    console.error('Error updating election schedule:', error);
    return { success: false, message: error.message || 'Failed to update schedule.' };
  }
}

export async function fetchCandidates(electionId: string) {
  try {
     const db = getDb();
     const electionCandidates = await db.select({
        id: candidates.id,
        manifesto: candidates.manifesto,
        posterUrl: candidates.posterUrl,
        name: profiles.fullName,
        designation: doctorDetails.specialization,
        avatarUrl: profiles.avatarUrl
     })
     .from(candidates)
     .innerJoin(profiles, eq(candidates.profileId, profiles.id))
     .leftJoin(doctorDetails, eq(doctorDetails.profileId, profiles.id))
     .where(and(eq(candidates.electionId, electionId), eq(candidates.status, 'approved')));
     return electionCandidates;
  } catch(error) {
    console.error('Error fetching candidates:', error);
    return [];
  }
}

export async function castVote(formData: FormData) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.id) {
      throw new Error('You must be logged in to vote.');
    }

    const electionId = formData.get('electionId') as string;
    const candidateId = formData.get('candidateId') as string;
    const voterId = session.user.id;

    if (!electionId || !candidateId) {
       throw new Error('Missing voting information.');
    }

    const db = getDb();

    // === GEOGRAPHY ELIGIBILITY CHECK ===
    const electionRows = await db.select().from(elections).where(eq(elections.id, electionId)).limit(1);
    if (electionRows.length === 0) throw new Error('Election not found.');
    const election = electionRows[0];

    const userState = session.user.state as string | null;
    const userDistrict = session.user.district as string | null;

    if (election.level === 'state') {
      if (!userState || userState.toLowerCase() !== (election.locationName || '').toLowerCase()) {
        throw new Error(`Only residents of ${election.locationName} can vote in this state election.`);
      }
    } else if (election.level === 'district') {
      if (!userDistrict || userDistrict.toLowerCase() !== (election.locationName || '').toLowerCase()) {
        throw new Error(`Only residents of ${election.locationName} district can vote in this election.`);
      }
    }

    // === 1-PERSON-1-VOTE CHECK ===
    const existingVote = await db.select()
      .from(votingRecords)
      .where(and(eq(votingRecords.electionId, electionId), eq(votingRecords.profileId, voterId)))
      .limit(1);

    if (existingVote.length > 0) {
      throw new Error('You have already cast your vote in this election.');
    }

    // === CAST ANONYMOUS BALLOT ===
    const tally = await db.select().from(voteTallies)
      .where(and(eq(voteTallies.candidateId, candidateId), eq(voteTallies.electionId, electionId)))
      .limit(1);

    if (tally.length > 0) {
       await db.update(voteTallies)
               .set({ count: (tally[0].count ?? 0) + 1 })
               .where(eq(voteTallies.id, tally[0].id));
    } else {
       await db.insert(voteTallies).values({
         id: randomUUID(),
         candidateId,
         electionId,
         count: 1
       });
    }

    // Record that user voted (not WHO they voted for)
    await db.insert(votingRecords).values({
      id: randomUUID(),
      electionId,
      profileId: voterId,
      votedAt: new Date()
    });

    return { success: true, message: 'Your vote has been securely and anonymously recorded! Thank you for participating.' };

  } catch(error: any) {
    return { success: false, message: error.message || 'Failed to submit vote.' };
  }
}
