CREATE TABLE `form_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`field_name` text NOT NULL,
	`label` text NOT NULL,
	`section` text NOT NULL,
	`is_visible` integer DEFAULT 1 NOT NULL,
	`is_required` integer DEFAULT 0 NOT NULL,
	`category_scope` text DEFAULT 'all' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `form_configs_field_name_unique` ON `form_configs` (`field_name`);