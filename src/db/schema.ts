import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// News & Announcements (Slider) - Moved to top to ensure export initialization
export const news = sqliteTable('news', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
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
  role: text('role').default('member').notNull(), // member, editor, admin, super_admin
  category: text('category').default('guest').notNull(), // guest, doctor, student
  state: text('state'), // new field for location-based elections
  district: text('district'), // new field for location-based elections
  avatarUrl: text('avatar_url'),
  fatherName: text('father_name'),
  bloodGroup: text('blood_group'),
  occupation: text('occupation'), // specifically for guests
  membershipType: text('membership_type').default('member').notNull(), // member, 2_year, aajivan, patron, vishisht
  membershipExpiryDate: integer('membership_expiry_date', { mode: 'timestamp' }),
  paymentReceiptUrl: text('payment_receipt_url'),
  paymentStatus: text('payment_status').default('pending').notNull(), // pending, verified, rejected
  createdAt: integer('created_at', { mode: 'timestamp' }),
  isDeleted: integer('is_deleted').default(0), // 0 for active, 1 for soft deleted
  customFields: text('custom_fields'), // JSON dynamic data
});

export const doctorDetails = sqliteTable('doctor_details', {
  id: text('id').primaryKey(),
  profileId: text('profile_id').references(() => profiles.id).notNull().unique(),
  degree: text('degree'),
  batch: text('batch'),
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
  permanentAddress: text('permanent_address'),
  currentAddress: text('current_address'),
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
  permanentAddress: text('permanent_address'),
  currentAddress: text('current_address'),
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
  postName: text('post_name').default('General').notNull(),
  level: text('level').default('national').notNull(), // national, state, district
  locationName: text('location_name'), // e.g., 'Rajasthan', 'Indore'
  status: text('status').default('upcoming').notNull(), // upcoming, active, completed
  nominationStartDate: integer('nomination_start_date', { mode: 'timestamp' }),
  nominationEndDate: integer('nomination_end_date', { mode: 'timestamp' }),
  startDate: integer('start_date', { mode: 'timestamp' }),
  endDate: integer('end_date', { mode: 'timestamp' }),
});

export const candidates = sqliteTable('candidates', {
  id: text('id').primaryKey(),
  electionId: text('election_id').references(() => elections.id).notNull(),
  profileId: text('profile_id').references(() => profiles.id).notNull(),
  manifesto: text('manifesto'),
  posterUrl: text('poster_url'),
  proposerId: text('proposer_id').references(() => profiles.id),
  seconderId: text('seconder_id').references(() => profiles.id),
  proposerStatus: text('proposer_status').default('pending').notNull(), // pending, approved, rejected
  seconderStatus: text('seconder_status').default('pending').notNull(), // pending, approved, rejected
  status: text('status').default('pending_references').notNull(), // pending_references, pending_approval, approved, rejected
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

// Advertisement Management
export const advertisements = sqliteTable('advertisements', {
  id: text('id').primaryKey(),
  businessName: text('business_name').notNull(),
  contactPerson: text('contact_person').notNull(),
  mobile: text('mobile').notNull(),
  imageUrls: text('image_urls').notNull(), // JSON array of strings
  linkUrl: text('link_url'),
  status: text('status').default('pending').notNull(), // pending, approved, rejected, expired
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Registration Form Configuration
export const formConfigs = sqliteTable('form_configs', {
  id: text('id').primaryKey(),
  fieldName: text('field_name').notNull().unique(),
  label: text('label').notNull(),
  section: text('section').notNull(), // basic, doctor, student, payment
  isVisible: integer('is_visible').default(1).notNull(), // 0 or 1
  isRequired: integer('is_required').default(0).notNull(), // 0 or 1
  categoryScope: text('category_scope').default('all').notNull(), // all, guest, doctor, student
  fieldType: text('field_type').default('text').notNull(), // text, number, select, date, etc.
  options: text('options'), // JSON string for select options
  storageMode: text('storage_mode').default('json').notNull(), // json, meta, column
  showInProfile: integer('show_in_profile').default(1).notNull(),
  showInPdf: integer('show_in_pdf').default(1).notNull(),
  showInDirectory: integer('show_in_directory').default(1).notNull(),
  showOnIdCard: integer('show_on_id_card').default(0).notNull(),
  orderIndex: integer('order_index').default(0).notNull(),
});

export const profileMetadata = sqliteTable('profile_metadata', {
  id: text('id').primaryKey(),
  profileId: text('profile_id').references(() => profiles.id).notNull(),
  fieldName: text('field_name').notNull(), // the custom_xxx field name
  fieldValue: text('field_value').notNull(),
});
