CREATE TABLE `commissionRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`orderId` int NOT NULL,
	`orderItemId` int NOT NULL,
	`saleAmountUsdd` decimal(18,6) NOT NULL,
	`commissionRate` decimal(5,4) NOT NULL,
	`commissionAmountUsdd` decimal(18,6) NOT NULL,
	`sellerEarningsUsdd` decimal(18,6) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commissionRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platformConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(64) NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platformConfig_id` PRIMARY KEY(`id`),
	CONSTRAINT `platformConfig_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `storeDeposits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`userId` int NOT NULL,
	`amountUsdd` decimal(18,6) NOT NULL,
	`status` enum('pending','confirmed','refunded','forfeited') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(32),
	`paymentTxHash` varchar(128),
	`confirmedAt` timestamp,
	`refundedAt` timestamp,
	`adminNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `storeDeposits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `storeOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`storeId` int NOT NULL,
	`subtotalUsdd` decimal(18,6) NOT NULL,
	`commissionUsdd` decimal(18,6) NOT NULL,
	`sellerEarningsUsdd` decimal(18,6) NOT NULL,
	`status` enum('pending_payment','paid','shipped','completed','cancelled') NOT NULL DEFAULT 'pending_payment',
	`trackingNumber` varchar(128),
	`shippedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `storeOrders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `storeProducts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`categoryId` int,
	`slug` varchar(128) NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`priceUsdd` decimal(18,6) NOT NULL,
	`originalPriceUsdd` decimal(18,6),
	`stock` int NOT NULL DEFAULT 0,
	`images` json,
	`tags` json,
	`weight` decimal(10,3),
	`isActive` int NOT NULL DEFAULT 1,
	`isFeatured` int NOT NULL DEFAULT 0,
	`externalPlatform` enum('tiktok','pinduoduo','xiaohongshu','amazon','shein','taobao','jd','lazada','shopee','other'),
	`externalUrl` text,
	`externalProductId` varchar(256),
	`salesCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `storeProducts_id` PRIMARY KEY(`id`),
	CONSTRAINT `storeProducts_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `stores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`slug` varchar(128) NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`logoUrl` text,
	`bannerUrl` text,
	`contactEmail` varchar(320),
	`contactPhone` varchar(32),
	`country` varchar(64),
	`status` enum('pending','active','suspended','rejected') NOT NULL DEFAULT 'pending',
	`commissionRate` decimal(5,4),
	`totalEarningsUsdd` decimal(18,6) NOT NULL DEFAULT '0',
	`pendingBalanceUsdd` decimal(18,6) NOT NULL DEFAULT '0',
	`adminNote` text,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stores_id` PRIMARY KEY(`id`),
	CONSTRAINT `stores_slug_unique` UNIQUE(`slug`)
);
