ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `phoneNumber` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `telegramId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `googleId` varchar(128);