CREATE TABLE `addresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fullName` varchar(128) NOT NULL,
	`phone` varchar(32),
	`country` varchar(64) NOT NULL,
	`state` varchar(64),
	`city` varchar(64) NOT NULL,
	`addressLine1` text NOT NULL,
	`addressLine2` text,
	`postalCode` varchar(16),
	`isDefault` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `addresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cartItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cartItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`nameEn` varchar(128) NOT NULL,
	`nameEs` varchar(128),
	`nameTr` varchar(128),
	`namePt` varchar(128),
	`nameAr` varchar(128),
	`nameRu` varchar(128),
	`iconUrl` text,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `chatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`sessionId` varchar(64) NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`language` varchar(8) DEFAULT 'en',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exchangeRates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`baseCurrency` varchar(8) NOT NULL DEFAULT 'USDD',
	`targetCurrency` varchar(8) NOT NULL,
	`rate` decimal(24,8) NOT NULL,
	`source` varchar(64),
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exchangeRates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`productName` varchar(256) NOT NULL,
	`productImage` text,
	`quantity` int NOT NULL,
	`unitPriceUsdd` decimal(18,6) NOT NULL,
	`subtotalUsdd` decimal(18,6) NOT NULL,
	CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`orderNumber` varchar(32) NOT NULL,
	`status` enum('pending_payment','paid','shipped','completed','cancelled') NOT NULL DEFAULT 'pending_payment',
	`totalUsdd` decimal(18,6) NOT NULL,
	`shippingAddress` json,
	`paymentMethod` varchar(32) DEFAULT 'usdd',
	`paymentTxHash` varchar(128),
	`paymentConfirmedAt` timestamp,
	`shippedAt` timestamp,
	`completedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int,
	`slug` varchar(128) NOT NULL,
	`nameEn` varchar(256) NOT NULL,
	`nameEs` varchar(256),
	`nameTr` varchar(256),
	`namePt` varchar(256),
	`nameAr` varchar(256),
	`nameRu` varchar(256),
	`descriptionEn` text,
	`descriptionEs` text,
	`descriptionTr` text,
	`descriptionPt` text,
	`descriptionAr` text,
	`descriptionRu` text,
	`priceUsdd` decimal(18,6) NOT NULL,
	`stock` int NOT NULL DEFAULT 0,
	`images` json DEFAULT ('[]'),
	`aiGeneratedImageUrl` text,
	`tags` json DEFAULT ('[]'),
	`isActive` int NOT NULL DEFAULT 1,
	`isFeatured` int NOT NULL DEFAULT 0,
	`weight` decimal(10,3),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `preferredLanguage` varchar(8) DEFAULT 'en';