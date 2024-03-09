CREATE TABLE `poll` (
	`id` integer PRIMARY KEY NOT NULL,
	`hash` text(6) NOT NULL,
	`user_id` integer NOT NULL,
	`title` text NOT NULL,
	`deleted` integer DEFAULT false,
	`closed` integer DEFAULT false,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `poll_option` (
	`id` integer PRIMARY KEY NOT NULL,
	`poll_id` integer NOT NULL,
	`text` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`poll_id`) REFERENCES `poll`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `poll_vote` (
	`id` integer PRIMARY KEY NOT NULL,
	`poll_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`option_id` integer NOT NULL,
	FOREIGN KEY (`poll_id`) REFERENCES `poll`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`option_id`) REFERENCES `poll_option`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_auth` (
	`id` integer PRIMARY KEY NOT NULL,
	`email` text,
	`user_id` integer NOT NULL,
	`provider` text NOT NULL,
	`provider_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` integer PRIMARY KEY NOT NULL,
	`hash` text(6) NOT NULL,
	`name` text NOT NULL,
	`avatar_url` text,
	`is_admin` integer,
	`created_at` integer NOT NULL,
	`disabled` integer DEFAULT false
);
--> statement-breakpoint
CREATE INDEX `poll_user_id_idx` ON `poll` (`user_id`);--> statement-breakpoint
CREATE INDEX `poll_option_poll_id_idx` ON `poll_option` (`poll_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_idx` ON `poll_vote` (`poll_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `user_auth_email_idx` ON `user_auth` (`email`);--> statement-breakpoint
CREATE INDEX `user_auth_user_id_idx` ON `user_auth` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_auth_provider_id_idx` ON `user_auth` (`provider_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `id_idx` ON `user` (`name`);