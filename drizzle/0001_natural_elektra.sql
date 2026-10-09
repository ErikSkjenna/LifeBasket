CREATE TABLE `food_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`day` text NOT NULL,
	`meal` text NOT NULL,
	`name` text NOT NULL,
	`food_id` text,
	`amount` real NOT NULL,
	`unit` text NOT NULL,
	`kcal` real NOT NULL,
	`protein` real,
	`carbs` real,
	`fat` real,
	`nutrients` text NOT NULL,
	`source` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_food_logs_user_day` ON `food_logs` (`user_id`,`day`);--> statement-breakpoint
CREATE TABLE `tracker_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`calorie_target` real,
	`weight_unit` text DEFAULT 'kg' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `weight_logs` (
	`user_id` text NOT NULL,
	`day` text NOT NULL,
	`kg` real NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `day`)
);
--> statement-breakpoint
ALTER TABLE `signups` ADD `offer` text DEFAULT 'legacy-interest' NOT NULL;