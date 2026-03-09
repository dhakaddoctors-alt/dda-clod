import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// News & Announcements (Slider) - Moved to top to ensure export initialization
export const news = sqliteTable('news', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  imageUrl: text('image_url').notNull(),
  linkUrl: text('link_url'), // Optional link when clicked
  isActive: integer('is_active').default(1), // 1 for shown, 0 for hidden
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(), // We can use UUID or standard strings
  fullName: text('full_name').notNull(),
  email: text('email').unique().notNull(),
  mobile: text('mobile').unique(),
  passwordHash: text('password_hash').notNull(),
  gender: text('gender'),
  maritalStatus: text('marital_status'),
  dob: integer('dob', { mode: 'timestamp' }),
  role: text('role').default('guest').notNull(), // guest, student, doctor, editor, admin, super_admin
  avatarUrl: text('avatar_url'),
  occupation: text('occupation'), // specifically for guests
  membershipType: text('membership_type').default('member').notNull(), // member, 2_year, aajivan, patron, vishisht
  membershipExpiryDate: integer('membership_expiry_date', { mode: 'timestamp' }),
  paymentReceiptUrl: text('payment_receipt_url'),
  paymentStatus: text('payment_status').default('pending').notNull(), // pending, verified, rejected
  createdAt: integer('created_at', { mode: 'timestamp' }),
  isDeleted: integer('is_deleted').default(0), // 0 for active, 1 for soft deleted
});

export const doctorDetails = sqliteTable('doctor_details', {
  id: text('id').primaryKey(),
  profileId: text('profile_id').references(() => profiles.id).notNull().unique(),
  degree: text('degree'),
  specialization: text('specialization'),
  hospitalName: text('hospital_name'),
  presentWorkingPlace: text('present_working_place'),
  registrationNo: text('registration_no'),
  experience: integer('experience'),
  clinicAddress: text('clinic_address'),
  consultationFee: integer('consultation_fee'),
  availabilityTimings: text('availability_timings'),
  memberships: text('memberships'),
  awards: text('awards'),
  websiteSocialLinks: text('website_social_links'),
});

export const studentDetails = sqliteTable('student_details', {
  id: text('id').primaryKey(),
  profileId: text('profile_id').references(() => profiles.id).notNull().unique(),
  college: text('college'),
  university: text('university'),
  course: text('course'),
  year: text('year'),
  collegeEntryYear: integer('college_entry_year'),
  gotraFather: text('gotra_father'),
  gotraMother: text('gotra_mother'),
  gotraGrandmother: text('gotra_grandmother'),
  futureGoals: text('future_goals'),
  internshipStatus: text('internship_status'),
  hobbiesInterests: text('hobbies_interests'),
  linkedinProfile: text('linkedin_profile'),
  bloodDonationWillingness: text('blood_donation_willingness'),
});

// For CMS & Social Features (Facebook-style feed)
export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  authorId: text('author_id').references(() => profiles.id).notNull(),
  content: text('content'),
  imageUrl: text('image_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  likesCount: integer('likes_count').default(0),
});

export const comments = sqliteTable('comments', {
  id: text('id').primaryKey(),
  postId: text('post_id').references(() => posts.id).notNull(),
  authorId: text('author_id').references(() => profiles.id).notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const postLikes = sqliteTable('post_likes', {
  id: text('id').primaryKey(),
  postId: text('post_id').references(() => posts.id).notNull(),
  profileId: text('profile_id').references(() => profiles.id).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const stories = sqliteTable('stories', {
  id: text('id').primaryKey(),
  authorId: text('author_id').references(() => profiles.id).notNull(),
  imageUrl: text('image_url').notNull(),
  caption: text('caption'), // New column for text/comments on the story
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

// Committees Management
export const committees = sqliteTable('committees', {
  id: text('id').primaryKey(),
  level: text('level').notNull(), // national, state, district
  locationName: text('location_name'), // e.g., 'Rajasthan', 'Jaipur'
});

export const committeeMembers = sqliteTable('committee_members', {
  id: text('id').primaryKey(),
  committeeId: text('committee_id').references(() => committees.id).notNull(),
  profileId: text('profile_id').references(() => profiles.id).notNull(),
  designation: text('designation').notNull(), // President, Secretary, Member
  rankOrder: integer('rank_order').default(0),
});

// Voting System (Gupt Matdaan)
export const elections = sqliteTable('elections', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('upcoming').notNull(), // upcoming, active, completed
  startDate: integer('start_date', { mode: 'timestamp' }),
  endDate: integer('end_date', { mode: 'timestamp' }),
});

export const candidates = sqliteTable('candidates', {
  id: text('id').primaryKey(),
  electionId: text('election_id').references(() => elections.id).notNull(),
  profileId: text('profile_id').references(() => profiles.id).notNull(),
  manifesto: text('manifesto'),
  posterUrl: text('poster_url'),
  status: text('status').default('pending_approval').notNull(), // pending_approval, approved, rejected
});

// Since it's anonymous ballot, we DO NOT store who voted for whom.
// We only keep track of the vote count for the candidate
export const voteTallies = sqliteTable('vote_tallies', {
  id: text('id').primaryKey(),
  candidateId: text('candidate_id').references(() => candidates.id).notNull(),
  electionId: text('election_id').references(() => elections.id).notNull(),
  count: integer('count').default(0).notNull(),
});

// And we keep track of who HAS voted, to ensure 1-person-1-vote
export const votingRecords = sqliteTable('voting_records', {
  id: text('id').primaryKey(),
  electionId: text('election_id').references(() => elections.id).notNull(),
  profileId: text('profile_id').references(() => profiles.id).notNull(),
  votedAt: integer('voted_at', { mode: 'timestamp' }).notNull(),
});
