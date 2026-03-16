CREATE TABLE `advertisements` (
	`id` text PRIMARY KEY NOT NULL,
	`business_name` text NOT NULL,
	`contact_person` text NOT NULL,
	`mobile` text NOT NULL,
	`image_urls` text NOT NULL,
	`link_url` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`email` text NOT NULL,
	`mobile` text,
	`password_hash` text NOT NULL,
	`gender` text,
	`marital_status` text,
	`dob` integer,
	`role` text DEFAULT 'member' NOT NULL,
	`category` text DEFAULT 'guest' NOT NULL,
	`state` text,
	`district` text,
	`avatar_url` text,
	`occupation` text,
	`membership_type` text DEFAULT 'member' NOT NULL,
	`membership_expiry_date` integer,
	`payment_receipt_url` text,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer,
	`is_deleted` integer DEFAULT 0
);
--> statement-breakpoint
INSERT INTO `__new_profiles`("id", "full_name", "email", "mobile", "password_hash", "gender", "marital_status", "dob", "role", "category", "state", "district", "avatar_url", "occupation", "membership_type", "membership_expiry_date", "payment_receipt_url", "payment_status", "created_at", "is_deleted") SELECT "id", "full_name", "email", "mobile", "password_hash", "gender", "marital_status", "dob", CASE WHEN role IN ('guest', 'doctor', 'student') THEN 'member' ELSE role END, CASE WHEN role IN ('guest', 'doctor', 'student') THEN role ELSE 'guest' END, "state", "district", "avatar_url", "occupation", "membership_type", "membership_expiry_date", "payment_receipt_url", "payment_status", "created_at", "is_deleted" FROM `profiles`;--> statement-breakpoint
DROP TABLE `profiles`;--> statement-breakpoint
ALTER TABLE `__new_profiles` RENAME TO `profiles`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_email_unique` ON `profiles` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_mobile_unique` ON `profiles` (`mobile`);