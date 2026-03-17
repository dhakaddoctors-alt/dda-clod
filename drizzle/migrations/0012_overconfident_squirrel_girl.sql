ALTER TABLE `form_configs` ADD `field_type` text DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE `form_configs` ADD `options` text;--> statement-breakpoint
ALTER TABLE `profiles` ADD `custom_fields` text;