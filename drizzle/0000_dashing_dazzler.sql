CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	`is_test` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_events_created` ON `events` (`created_at`);--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`rating` integer NOT NULL,
	`comment` text NOT NULL,
	`email` text,
	`source` text NOT NULL,
	`is_test` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_feedback_created` ON `feedback` (`created_at`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_limits_expiry` ON `rate_limits` (`expires_at`);--> statement-breakpoint
CREATE TABLE `signups` (
	`email` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`source` text NOT NULL,
	`campaign` text NOT NULL,
	`visitor_id` text,
	`consent` integer NOT NULL,
	`is_test` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_signups_created` ON `signups` (`created_at`);--> statement-breakpoint
CREATE TABLE `visits` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`source` text NOT NULL,
	`campaign` text NOT NULL,
	`active_seconds` integer DEFAULT 0 NOT NULL,
	`is_test` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_visits_started` ON `visits` (`started_at`);