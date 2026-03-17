CREATE TABLE `profile_metadata` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`field_name` text NOT NULL,
	`field_value` text NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `form_configs` ADD `storage_mode` text DEFAULT 'json' NOT NULL;--> statement-breakpoint
ALTER TABLE `form_configs` ADD `show_in_profile` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `form_configs` ADD `show_in_pdf` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `form_configs` ADD `show_in_directory` integer DEFAULT 1 NOT NULL;