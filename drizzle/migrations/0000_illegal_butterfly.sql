CREATE TABLE `candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`election_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`manifesto` text,
	`poster_url` text,
	`status` text DEFAULT 'pending_approval' NOT NULL,
	FOREIGN KEY (`election_id`) REFERENCES `elections`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`author_id` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `committee_members` (
	`id` text PRIMARY KEY NOT NULL,
	`committee_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`designation` text NOT NULL,
	`rank_order` integer DEFAULT 0,
	FOREIGN KEY (`committee_id`) REFERENCES `committees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `committees` (
	`id` text PRIMARY KEY NOT NULL,
	`level` text NOT NULL,
	`location_name` text
);
--> statement-breakpoint
CREATE TABLE `doctor_details` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`degree` text,
	`specialization` text,
	`hospital_name` text,
	`present_working_place` text,
	`registration_no` text,
	`experience` integer,
	`clinic_address` text,
	`consultation_fee` integer,
	`availability_timings` text,
	`memberships` text,
	`awards` text,
	`website_social_links` text,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `doctor_details_profile_id_unique` ON `doctor_details` (`profile_id`);--> statement-breakpoint
CREATE TABLE `elections` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'upcoming' NOT NULL,
	`start_date` integer,
	`end_date` integer
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text NOT NULL,
	`content` text,
	`image_url` text,
	`created_at` integer NOT NULL,
	`likes_count` integer DEFAULT 0,
	FOREIGN KEY (`author_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`email` text NOT NULL,
	`mobile` text,
	`password_hash` text NOT NULL,
	`gender` text,
	`marital_status` text,
	`dob` integer,
	`role` text DEFAULT 'guest' NOT NULL,
	`avatar_url` text,
	`occupation` text,
	`membership_type` text DEFAULT 'member' NOT NULL,
	`membership_expiry_date` integer,
	`payment_receipt_url` text,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_email_unique` ON `profiles` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_mobile_unique` ON `profiles` (`mobile`);--> statement-breakpoint
CREATE TABLE `stories` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text NOT NULL,
	`image_url` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `student_details` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`college` text,
	`university` text,
	`course` text,
	`year` text,
	`college_entry_year` integer,
	`gotra_father` text,
	`gotra_mother` text,
	`gotra_grandmother` text,
	`future_goals` text,
	`internship_status` text,
	`hobbies_interests` text,
	`linkedin_profile` text,
	`blood_donation_willingness` text,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `student_details_profile_id_unique` ON `student_details` (`profile_id`);--> statement-breakpoint
CREATE TABLE `vote_tallies` (
	`id` text PRIMARY KEY NOT NULL,
	`candidate_id` text NOT NULL,
	`election_id` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`election_id`) REFERENCES `elections`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `voting_records` (
	`id` text PRIMARY KEY NOT NULL,
	`election_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`voted_at` integer NOT NULL,
	FOREIGN KEY (`election_id`) REFERENCES `elections`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
