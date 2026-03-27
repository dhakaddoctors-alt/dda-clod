'use server';

import { elections, electionPosts, candidates, doctorDetails, voteTallies, votingRecords, profiles } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getDb } from '@/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';

export async function fetchActiveElections() {
  try {
    const db = getDb();
    // Return all elections with their associated positions
    const allElections = await db.select().from(elections);
    const allPositions = await db.select().from(electionPosts);

    // Group positions by electionId
    const electionsWithPositions = allElections.map(election => ({
      ...election,
      positions: allPositions.filter(p => p.electionId === election.id)
    }));

    return electionsWithPositions;
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
       status: 'draft'
    });

    revalidatePath('/admin');
    revalidatePath('/elections');

    return { success: true, electionId: newElectionId, message: 'Step 1 complete: Election created. Now please add positions.' };
  } catch (error: any) {
    console.error('Error creating election:', error);
    return { success: false, message: error.message || 'Failed to create election.' };
  }
}

export async function addPositionToElection(electionId: string, name: string) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
      throw new Error('Unauthorized');
    }

    if (!name) throw new Error('Position name is required.');

    const db = getDb();
    const newPostId = `post_${randomUUID()}`;

    await db.insert(electionPosts).values({
      id: newPostId,
      electionId,
      name,
      status: 'active'
    });

    revalidatePath('/admin');
    return { success: true, postId: newPostId, message: 'Position added successfully.' };
  } catch (error: any) {
    console.error('Error adding position:', error);
    return { success: false, message: error.message || 'Failed to add position.' };
  }
}

export async function deletePosition(postId: string) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
      throw new Error('Unauthorized');
    }

    const db = getDb();
    await db.delete(electionPosts).where(eq(electionPosts.id, postId));

    revalidatePath('/admin');
    return { success: true, message: 'Position deleted successfully.' };
  } catch (error: any) {
    console.error('Error deleting position:', error);
    return { success: false, message: error.message || 'Failed to delete position.' };
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

export async function adminUpdateElectionDetails(electionId: string, payload: { title: string, description: string, level: string, locationName: string | null }) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
      throw new Error('Unauthorized');
    }

    if (!payload.title) throw new Error('Election Title is required.');

    const db = getDb();
    await db.update(elections)
      .set({
        title: payload.title,
        description: payload.description,
        level: payload.level,
        locationName: payload.level === 'national' ? null : payload.locationName
      })
      .where(eq(elections.id, electionId));

    revalidatePath('/admin');
    revalidatePath('/elections');
    
    return { success: true, message: 'Election details updated successfully.' };
  } catch (error: any) {
    console.error('Error updating election details:', error);
    return { success: false, message: error.message || 'Failed to update election properties.' };
  }
}

export async function adminDeleteElection(electionId: string) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
      throw new Error('Unauthorized');
    }

    const db = getDb();
    // Cascade delete related records
    await db.delete(voteTallies).where(eq(voteTallies.electionId, electionId));
    await db.delete(votingRecords).where(eq(votingRecords.electionId, electionId));
    await db.delete(candidates).where(eq(candidates.electionId, electionId));
    await db.delete(electionPosts).where(eq(electionPosts.electionId, electionId));
    await db.delete(elections).where(eq(elections.id, electionId));

    revalidatePath('/admin');
    revalidatePath('/elections');
    
    return { success: true, message: 'Election and all related data completely deleted.' };
  } catch (error: any) {
    console.error('Error deleting election:', error);
    return { success: false, message: error.message || 'Failed to delete election.' };
  }
}

export async function fetchCandidates(electionId: string) {
  try {
     const db = getDb();
     const electionCandidates = await db.select({
        id: candidates.id,
        manifesto: candidates.manifesto,
        posterUrl: candidates.posterUrl,
        positionName: electionPosts.name,
        name: profiles.fullName,
        designation: doctorDetails.specialization,
        avatarUrl: profiles.avatarUrl
     })
     .from(candidates)
     .innerJoin(profiles, eq(candidates.profileId, profiles.id))
     .leftJoin(doctorDetails, eq(doctorDetails.profileId, profiles.id))
     .leftJoin(electionPosts, eq(candidates.postId, electionPosts.id))
     .where(and(eq(candidates.electionId, electionId), eq(candidates.status, 'approved')));
     return electionCandidates;
  } catch(error) {
    console.error('Error fetching candidates:', error);
    return [];
  }
}

// === ADMIN CANDIDATE MANAGEMENT ===

export async function adminFetchAllCandidates(electionId: string) {
  try {
     const session = await getServerSession(authOptions) as any;
     if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
       throw new Error('Unauthorized');
     }
     
     const db = getDb();
     const allCandidates = await db.select({
        id: candidates.id,
        electionId: candidates.electionId,
        postId: candidates.postId,
        positionName: electionPosts.name,
        manifesto: candidates.manifesto,
        posterUrl: candidates.posterUrl,
        status: candidates.status,
        name: profiles.fullName,
        designation: doctorDetails.specialization,
        avatarUrl: profiles.avatarUrl,
        state: profiles.state,
        district: profiles.district,
        proposerId: candidates.proposerId,
        seconderId: candidates.seconderId,
        proposerStatus: candidates.proposerStatus,
        seconderStatus: candidates.seconderStatus
     })
     .from(candidates)
     .innerJoin(profiles, eq(candidates.profileId, profiles.id))
     .leftJoin(doctorDetails, eq(doctorDetails.profileId, profiles.id))
     .leftJoin(electionPosts, eq(candidates.postId, electionPosts.id))
     .where(eq(candidates.electionId, electionId));
     
     return allCandidates;
  } catch(error) {
    console.error('Error fetching all candidates:', error);
    return [];
  }
}

export async function adminUpdateCandidateStatus(candidateId: string, status: 'approved' | 'rejected') {
  try {
     const session = await getServerSession(authOptions) as any;
     if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
       throw new Error('Unauthorized');
     }

     const db = getDb();
     await db.update(candidates)
       .set({ status })
       .where(eq(candidates.id, candidateId));

     revalidatePath('/admin');
     revalidatePath('/elections');
     return { success: true, message: `Candidate ${status} successfully.` };
  } catch(error: any) {
    console.error('Error updating candidate:', error);
    return { success: false, message: error.message || 'Failed to update candidate status.' };
  }
}

export async function adminDeleteCandidate(candidateId: string) {
  try {
     const session = await getServerSession(authOptions) as any;
     if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
       throw new Error('Unauthorized');
     }

     const db = getDb();
     // If candidate is deleted, we should also delete their vote tallies to maintain integrity
     await db.delete(voteTallies).where(eq(voteTallies.candidateId, candidateId));
     await db.delete(candidates).where(eq(candidates.id, candidateId));

     revalidatePath('/admin');
     revalidatePath('/elections');
     return { success: true, message: 'Candidate completely deleted.' };
  } catch(error: any) {
    console.error('Error deleting candidate:', error);
    return { success: false, message: error.message || 'Failed to delete candidate.' };
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
    const postId = formData.get('postId') as string;
    const voterId = session.user.id;

    if (!electionId || !candidateId || !postId) {
       throw new Error('Missing voting information.');
    }

    const db = getDb();

    // === GEOGRAPHY ELIGIBILITY CHECK ===
    const electionRows = await db.select().from(elections).where(eq(elections.id, electionId)).limit(1);
    if (electionRows.length === 0) throw new Error('Election not found.');
    const election = electionRows[0];

    // Status Check
    if (election.status !== 'active') throw new Error('This election is not currently open for voting.');

    // Geography Logic
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

    // === 1-PERSON-1-VOTE CHECK (PER POSITION) ===
    const existingVote = await db.select()
      .from(votingRecords)
      .where(and(
        eq(votingRecords.electionId, electionId), 
        eq(votingRecords.postId, postId),
        eq(votingRecords.profileId, voterId)
      ))
      .limit(1);

    if (existingVote.length > 0) {
      throw new Error('You have already cast your vote for this position.');
    }

    // === CAST ANONYMOUS BALLOT ===
    const tallyRows = await db.select().from(voteTallies)
      .where(and(eq(voteTallies.candidateId, candidateId), eq(voteTallies.postId, postId)))
      .limit(1);

    if (tallyRows.length > 0) {
       await db.update(voteTallies)
               .set({ count: (tallyRows[0].count ?? 0) + 1 })
               .where(eq(voteTallies.id, tallyRows[0].id));
    } else {
       await db.insert(voteTallies).values({
         id: randomUUID(),
         candidateId,
         electionId,
         postId,
         count: 1
       });
    }

    // Record that user voted (not WHO they voted for)
    await db.insert(votingRecords).values({
      id: randomUUID(),
      electionId,
      postId,
      profileId: voterId,
      votedAt: new Date()
    });

    revalidatePath('/elections');
    revalidatePath(`/elections/${electionId}`);

    return { success: true, message: 'Your vote has been securely and anonymously recorded! Thank you for participating.' };

  } catch(error: any) {
    return { success: false, message: error.message || 'Failed to submit vote.' };
  }
}
