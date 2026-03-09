CREATE TABLE `news` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`image_url` text NOT NULL,
	`link_url` text,
	`is_active` integer DEFAULT 1,
	`created_at` integer NOT NULL
);
