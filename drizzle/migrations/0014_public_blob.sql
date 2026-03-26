ALTER TABLE `doctor_details` ADD `permanent_address` text;--> statement-breakpoint
ALTER TABLE `doctor_details` ADD `current_address` text;--> statement-breakpoint
ALTER TABLE `form_configs` ADD `show_on_id_card` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `form_configs` ADD `order_index` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `news` ADD `description` text;--> statement-breakpoint
ALTER TABLE `student_details` ADD `permanent_address` text;--> statement-breakpoint
ALTER TABLE `student_details` ADD `current_address` text;