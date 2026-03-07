'use server';

import { getDb } from '@/db';
import { committees, committeeMembers, profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

export async function fetchCommitteesWithMembers() {
  const db = getDb();
  const allCommittees = await db.select().from(committees).orderBy(committees.level);
  
  const result = await Promise.all(
    allCommittees.map(async (committee) => {
      const members = await db
        .select({
          id: committeeMembers.id,
          profileId: committeeMembers.profileId,
          designation: committeeMembers.designation,
          rankOrder: committeeMembers.rankOrder,
          name: profiles.fullName,
          avatarUrl: profiles.avatarUrl,
        })
        .from(committeeMembers)
        .leftJoin(profiles, eq(committeeMembers.profileId, profiles.id))
        .where(eq(committeeMembers.committeeId, committee.id))
        .orderBy(committeeMembers.rankOrder);
      
      return { ...committee, members };
    })
  );
  
  return result;
}

export async function addCommittee(level: string, locationName: string) {
  const db = getDb();
  const id = randomUUID();
  await db.insert(committees).values({ id, level, locationName });
  revalidatePath('/committees');
  revalidatePath('/admin');
}

export async function deleteCommittee(committeeId: string) {
  const db = getDb();
  await db.delete(committeeMembers).where(eq(committeeMembers.committeeId, committeeId));
  await db.delete(committees).where(eq(committees.id, committeeId));
  revalidatePath('/committees');
  revalidatePath('/admin');
}

export async function addCommitteeMember(committeeId: string, profileId: string, designation: string, rankOrder: number) {
  const db = getDb();
  const id = randomUUID();
  await db.insert(committeeMembers).values({ id, committeeId, profileId, designation, rankOrder });
  revalidatePath('/committees');
  revalidatePath('/admin');
}

export async function removeCommitteeMember(memberId: string) {
  const db = getDb();
  await db.delete(committeeMembers).where(eq(committeeMembers.id, memberId));
  revalidatePath('/committees');
  revalidatePath('/admin');
}

export async function saveCommitteeHierarchy(tiers: { committeeId: string; members: { memberId: string; rankOrder: number }[] }[]) {
  const db = getDb();
  for (const tier of tiers) {
    for (const member of tier.members) {
      await db
        .update(committeeMembers)
        .set({ rankOrder: member.rankOrder })
        .where(eq(committeeMembers.id, member.memberId));
    }
  }
  revalidatePath('/committees');
  revalidatePath('/admin');
  return { success: true };
}

export async function searchProfiles(query: string) {
  const db = getDb();
  const allProfiles = await db
    .select({ id: profiles.id, fullName: profiles.fullName, role: profiles.role, avatarUrl: profiles.avatarUrl })
    .from(profiles)
    .limit(20);
  
  // Filter in memory since SQLite via D1 doesn't support LIKE easily in all drivers
  if (!query) return allProfiles.slice(0, 10);
  const q = query.toLowerCase();
  return allProfiles.filter(p => p.fullName?.toLowerCase().includes(q)).slice(0, 10);
}
