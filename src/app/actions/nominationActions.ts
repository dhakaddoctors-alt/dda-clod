'use server';

import { candidates, elections, electionPosts, profiles, voteTallies, votingRecords } from '@/db/schema';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/db';
import { eq, sql, and, like, or, inArray } from 'drizzle-orm';
import { uploadToR2 } from '@/lib/storage';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function submitNomination(formData: FormData) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.id) {
      throw new Error('You must be logged in to submit a nomination.');
    }
    
    // Check if user is a doctor or student
    if (session.user.category !== 'doctor' && session.user.category !== 'student') {
       throw new Error('Only registered Doctors and Students are eligible to submit nominations.');
    }

    const electionId = formData.get('electionId') as string;
    const postId = formData.get('postId') as string; // NEW: The specific position being contested
    const manifesto = formData.get('manifesto') as string;
    const proposerId = formData.get('proposerId') as string;
    const seconderId = formData.get('seconderId') as string;
    let posterUrl = formData.get('posterUrl') as string || null;
    const posterFile = formData.get('posterFile') as File | null;
    if (posterFile && posterFile.size > 0) {
      posterUrl = await uploadToR2(posterFile);
    }
    
    const candidateProfileId = session.user.id;

    if (!electionId || !postId) {
      throw new Error('Election and Position selection are required.');
    }
    
    if (!proposerId || !seconderId) {
      throw new Error('A Proposer and a Seconder are required for nomination.');
    }
    
    if (proposerId === candidateProfileId || seconderId === candidateProfileId) {
      throw new Error('You cannot propose or second your own nomination.');
    }
    
    if (proposerId === seconderId) {
       throw new Error('The Proposer and Seconder must be different members.');
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

    // === Level-based Nomination Limit check ===
    const currentLevel = election.level;

    // Fetch existing nominations of the user at the same tier (National/State/District)
    const userNominationsAtLevel = await db.select({
       id: candidates.id,
       electionId: candidates.electionId,
       postId: candidates.postId,
       electionTitle: elections.title,
       positionName: electionPosts.name,
       level: elections.level
    })
    .from(candidates)
    .innerJoin(elections, eq(candidates.electionId, elections.id))
    .leftJoin(electionPosts, eq(candidates.postId, electionPosts.id))
    .where(and(eq(candidates.profileId, candidateProfileId), eq(elections.level, currentLevel)));

    if (userNominationsAtLevel.length > 0) {
       const existingNominationAtLevel = userNominationsAtLevel[0];
       // If the user already has a nomination at this level, it MUST be for the SAME position ID to allow editing.
       // If it's for a DIFFERENT position (even in the same election or a different one at the same level), they are blocked.
       if (existingNominationAtLevel.postId !== postId) {
          throw new Error(`You have already filed a nomination for '${existingNominationAtLevel.positionName}' (${existingNominationAtLevel.electionTitle}) at the ${currentLevel.toUpperCase()} level. You can only contest for one position per level.`);
       }
    }

    const existingCandidate = userNominationsAtLevel.find(n => n.postId === postId);

    // Verify Proposer & Seconder are valid active members
    const [proposer, seconder] = await Promise.all([
      db.select().from(profiles).where(eq(profiles.id, proposerId)).limit(1),
      db.select().from(profiles).where(eq(profiles.id, seconderId)).limit(1)
    ]);

    if (!proposer[0] || (proposer[0].category !== 'doctor' && proposer[0].category !== 'student') || proposer[0].paymentStatus !== 'verified') {
       throw new Error('Invalid Proposer selected. They must be a verified Member.');
    }
    if (!seconder[0] || (seconder[0].category !== 'doctor' && seconder[0].category !== 'student') || seconder[0].paymentStatus !== 'verified') {
       throw new Error('Invalid Seconder selected. They must be a verified Member.');
    }

    if (existingCandidate) {
       // Update existing
       const cId = existingCandidate.id;
       await db.update(candidates)
         .set({
           manifesto,
           ...(posterUrl && { posterUrl }), // only update poster if a new one is provided
           proposerId,
           seconderId,
           proposerStatus: 'pending',
           seconderStatus: 'pending',
           status: 'pending_references'
         })
         .where(eq(candidates.id, cId));
         
       revalidatePath('/desktop/elections/nominate');
       return { success: true, message: 'Your existing nomination has been updated successfully.' };
    } else {
       // Insert new
       await db.insert(candidates).values({
         id: randomUUID(),
         electionId,
         postId,
         profileId: candidateProfileId,
         manifesto,
         posterUrl,
         proposerId,
         seconderId,
         proposerStatus: 'pending',
         seconderStatus: 'pending',
         status: 'pending_references'
       });
       console.log(`[DB] Submitted new nomination for ${candidateProfileId} for position ${postId} in election ${electionId}`);
       revalidatePath('/desktop/elections/nominate');
       return { success: true, message: 'Nomination submitted successfully. Pending Admin approval.' };
    }
  } catch (error: any) {
    console.error('Error submitting nomination:', error);
    return { success: false, message: error.message || 'Failed to submit nomination.' };
  }
}

    export async function fetchLiveElectionAnalytics(electionId: string) {
        try {
            const db = getDb();
            
            // 1. Fetch total eligible voters (All verified profiles)
            let totalVotersQuery: any = await db.select({ count: sql`count(*)` })
              .from(profiles).where(eq(profiles.paymentStatus, 'verified'));
            const totalEligibleVoters = Number(totalVotersQuery[0]?.count || 0);
    
            // 2. Fetch total votes cast in this election
            let totalVotesQuery: any = await db.select({ count: sql`count(*)` })
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

export async function fetchUserNominations() {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user?.id) return [];

        const db = getDb();
        const userCandidates = await db.select({
            id: candidates.id,
            electionId: candidates.electionId,
            postId: candidates.postId,
            positionName: electionPosts.name,
            manifesto: candidates.manifesto,
            posterUrl: candidates.posterUrl,
            status: candidates.status,
            level: elections.level,
            proposerId: candidates.proposerId,
            seconderId: candidates.seconderId,
            electionTitle: elections.title
        })
            .from(candidates)
            .innerJoin(elections, eq(candidates.electionId, elections.id))
            .leftJoin(electionPosts, eq(candidates.postId, electionPosts.id))
            .where(eq(candidates.profileId, session.user.id));
            
        return userCandidates;
    } catch (error) {
        console.error('Error fetching user nominations:', error);
        return [];
    }
}

export async function searchMembersForReference(query: string) {
    if (!query || query.length < 3) return [];
    
    try {
        const db = getDb();
        const searchPattern = `%${query}%`;
        const results = await db.select({
            id: profiles.id,
            fullName: profiles.fullName,
            category: profiles.category,
            district: profiles.district,
            mobile: profiles.mobile
        })
        .from(profiles)
        .where(
            and(
                inArray(profiles.category, ['doctor', 'student']),
                eq(profiles.paymentStatus, 'verified'),
                or(
                    like(profiles.fullName, searchPattern),
                    like(profiles.mobile, searchPattern)
                )
            )
        )
        .limit(10);
        
        return results;
    } catch (error) {
        console.error('Error searching members:', error);
        return [];
    }
}

export async function fetchPendingReferencesForUser() {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user?.id) return [];

        const db = getDb();
        const userId = session.user.id;

        // Fetch nominations where the current user is either the proposer or seconder
        const pendingRefs = await db.select({
            id: candidates.id,
            electionId: candidates.electionId,
            electionTitle: elections.title,
            electionLevel: elections.level,
            electionPost: elections.postName,
            candidateId: candidates.profileId,
            candidateName: profiles.fullName,
            candidatePhone: profiles.mobile,
            candidateCategory: profiles.category,
            roleAs: sql<string>`CASE WHEN ${candidates.proposerId} = ${userId} THEN 'Proposer' ELSE 'Seconder' END`,
            refStatus: sql<string>`CASE WHEN ${candidates.proposerId} = ${userId} THEN ${candidates.proposerStatus} ELSE ${candidates.seconderStatus} END`
        })
        .from(candidates)
        .innerJoin(elections, eq(candidates.electionId, elections.id))
        .innerJoin(profiles, eq(candidates.profileId, profiles.id))
        .where(
            and(
                eq(candidates.status, 'pending_references'),
                or(
                    and(eq(candidates.proposerId, userId), eq(candidates.proposerStatus, 'pending')),
                    and(eq(candidates.seconderId, userId), eq(candidates.seconderStatus, 'pending'))
                )
            )
        );

        return pendingRefs;
    } catch (error) {
        console.error('Error fetching pending references:', error);
        return [];
    }
}

export async function respondToReference(candidateId: string, role: 'Proposer' | 'Seconder', action: 'approve' | 'reject') {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user?.id) throw new Error('Unauthorized');
        
        const db = getDb();
        const userId = session.user.id;
        
        // Fetch current candidate details
        const candData = await db.select().from(candidates).where(eq(candidates.id, candidateId)).limit(1);
        if (candData.length === 0) throw new Error('Nomination not found');
        const cand = candData[0];
        
        // Verify this user is actually the assigned reference
        if (role === 'Proposer' && cand.proposerId !== userId) throw new Error('Not authorized as Proposer');
        if (role === 'Seconder' && cand.seconderId !== userId) throw new Error('Not authorized as Seconder');
        
        const newRefStatus = action === 'approve' ? 'approved' : 'rejected';
        
        // Execute the targeted update
        await db.update(candidates)
            .set(role === 'Proposer' ? { proposerStatus: newRefStatus } : { seconderStatus: newRefStatus })
            .where(eq(candidates.id, candidateId));
            
        // If rejected, the candidate stays in pending_references but with a rejected slot, so they know to change it.
        // If approved, we need to check if BOTH are now approved.
        if (action === 'approve') {
            const isOtherApproved = role === 'Proposer' 
                ? cand.seconderStatus === 'approved' 
                : cand.proposerStatus === 'approved';
                
            if (isOtherApproved) {
                // Both are approved! Move candidate's main status to pending_approval for Admin review.
                await db.update(candidates)
                    .set({ status: 'pending_approval' })
                    .where(eq(candidates.id, candidateId));
            }
        }
        
        revalidatePath('/dashboard');
        return { success: true, message: `Successfully ${newRefStatus} the nomination reference.` };
    } catch (error: any) {
        console.error('Error responding to reference:', error);
        return { success: false, message: error.message || 'Failed to process response.' };
    }
}

export async function withdrawNomination(candidateId: string) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.id) throw new Error('Unauthorized');
    
    const db = getDb();
    // Verify ownership
    const candRows = await db.select().from(candidates).where(eq(candidates.id, candidateId)).limit(1);
    if (candRows.length === 0) throw new Error('Nomination not found');
    if (candRows[0].profileId !== session.user.id) throw new Error('Unauthorized');

    // Delete the nomination
    await db.delete(candidates).where(eq(candidates.id, candidateId));
    
    revalidatePath('/desktop/elections/nominate');
    revalidatePath('/elections');
    return { success: true, message: 'Your nomination has been withdrawn successfully.' };
  } catch (error: any) {
    console.error('Error withdrawing nomination:', error);
    return { success: false, message: error.message || 'Failed to withdraw nomination.' };
  }
}
