PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`election_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`manifesto` text,
	`poster_url` text,
	`proposer_id` text,
	`seconder_id` text,
	`proposer_status` text DEFAULT 'pending' NOT NULL,
	`seconder_status` text DEFAULT 'pending' NOT NULL,
	`status` text DEFAULT 'pending_references' NOT NULL,
	FOREIGN KEY (`election_id`) REFERENCES `elections`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`proposer_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`seconder_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_candidates`("id", "election_id", "profile_id", "manifesto", "poster_url", "proposer_id", "seconder_id", "proposer_status", "seconder_status", "status") SELECT "id", "election_id", "profile_id", "manifesto", "poster_url", "proposer_id", "seconder_id", "proposer_status", "seconder_status", "status" FROM `candidates`;--> statement-breakpoint
DROP TABLE `candidates`;--> statement-breakpoint
ALTER TABLE `__new_candidates` RENAME TO `candidates`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `elections` ADD `post_name` text DEFAULT 'General' NOT NULL;