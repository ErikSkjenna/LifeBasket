CREATE TABLE `creator_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`creator_id` integer NOT NULL,
	`credential_version` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`creator_id`) REFERENCES `creators`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_creator_sessions_expiry` ON `creator_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `creators` (
	`id` integer PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`credential_version` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
