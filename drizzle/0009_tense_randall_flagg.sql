CREATE TABLE `bulkDiscounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int,
	`categoryId` int,
	`minQty` int NOT NULL,
	`discountPct` decimal(5,2) NOT NULL,
	`label` varchar(128),
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bulkDiscounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lowStockThresholds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`threshold` int NOT NULL DEFAULT 10,
	`lastNotifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lowStockThresholds_id` PRIMARY KEY(`id`),
	CONSTRAINT `lowStockThresholds_productId_unique` UNIQUE(`productId`)
);
