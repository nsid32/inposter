CREATE TABLE `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`linkedin_id` text,
	`content` text NOT NULL,
	`source` text DEFAULT 'ai_generated' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`tone` text,
	`published_at` text,
	`linkedin_url` text,
	`likes` integer DEFAULT 0,
	`comments` integer DEFAULT 0,
	`shares` integer DEFAULT 0,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`encrypted` integer DEFAULT false,
	`updated_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `posts_linkedin_id_unique` ON `posts` (`linkedin_id`);