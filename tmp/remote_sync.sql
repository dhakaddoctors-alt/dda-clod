
-- 1. Cleanup from failed 0008
DROP TABLE IF EXISTS __new_profiles;

-- 2. Migration 0013 - Table Creation
CREATE TABLE IF NOT EXISTS `profile_metadata` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`field_name` text NOT NULL,
	`field_value` text NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);

-- 3. Migration 0013 - form_configs enhancements
-- We wrap these in individual execute calls or handles since ADD COLUMN might fail if already there
ALTER TABLE `form_configs` ADD `storage_mode` text DEFAULT 'json' NOT NULL;
ALTER TABLE `form_configs` ADD `show_in_profile` integer DEFAULT 1 NOT NULL;
ALTER TABLE `form_configs` ADD `show_in_pdf` integer DEFAULT 1 NOT NULL;
ALTER TABLE `form_configs` ADD `show_in_directory` integer DEFAULT 1 NOT NULL;

-- 4. Mark migrations as applied in d1_migrations to avoid future conflicts
-- Migration names: 0008, 0009, 0010, 0011, 0012, 0013
INSERT OR IGNORE INTO d1_migrations (id, name, applied_at) VALUES 
(100, '0008_powerful_klaw.sql', datetime('now')),
(101, '0009_woozy_lethal_legion.sql', datetime('now')),
(102, '0010_productive_korvac.sql', datetime('now')),
(103, '0011_moaning_champions.sql', datetime('now')),
(104, '0012_overconfident_squirrel_girl.sql', datetime('now')),
(105, '0013_cooing_radioactive_man.sql', datetime('now'));
