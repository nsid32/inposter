CREATE INDEX IF NOT EXISTS `idx_posts_status` ON `posts`(`status`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_posts_published_at` ON `posts`(`published_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_posts_created_at` ON `posts`(`created_at`);
