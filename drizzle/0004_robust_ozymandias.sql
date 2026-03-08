CREATE TABLE `dropshipLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`influencerStoreId` int NOT NULL,
	`influencerProductId` int NOT NULL,
	`supplyChainProductId` int NOT NULL,
	`supplyChainStoreId` int NOT NULL,
	`markupPriceUsdd` decimal(18,6) NOT NULL,
	`basePriceUsdd` decimal(18,6) NOT NULL,
	`influencerMarginUsdd` decimal(18,6) NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dropshipLinks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dropshipOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeOrderId` int NOT NULL,
	`influencerStoreId` int NOT NULL,
	`supplyChainStoreId` int NOT NULL,
	`supplyChainProductId` int NOT NULL,
	`quantity` int NOT NULL,
	`basePriceUsdd` decimal(18,6) NOT NULL,
	`totalCostUsdd` decimal(18,6) NOT NULL,
	`shippingName` varchar(128),
	`shippingPhone` varchar(32),
	`shippingAddress` text,
	`shippingCountry` varchar(64),
	`status` enum('pending','accepted','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`trackingNumber` varchar(128),
	`supplyChainNote` text,
	`shippedAt` timestamp,
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dropshipOrders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referralCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`code` varchar(16) NOT NULL,
	`totalReferrals` int NOT NULL DEFAULT 0,
	`totalRewardsUsdd` decimal(18,6) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referralCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `referralCodes_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `referralCodes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `referralRelations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`referredByUserId` int NOT NULL,
	`l2UserId` int,
	`l3UserId` int,
	`referralCode` varchar(16) NOT NULL,
	`firstPurchaseDone` int NOT NULL DEFAULT 0,
	`firstPurchaseAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referralRelations_id` PRIMARY KEY(`id`),
	CONSTRAINT `referralRelations_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `referralRewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`beneficiaryUserId` int NOT NULL,
	`referredUserId` int NOT NULL,
	`orderId` int NOT NULL,
	`level` int NOT NULL,
	`orderAmountUsdd` decimal(18,6) NOT NULL,
	`rewardRate` decimal(5,4) NOT NULL,
	`rewardAmountUsdd` decimal(18,6) NOT NULL,
	`status` enum('pending','confirmed','paid','cancelled') NOT NULL DEFAULT 'pending',
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referralRewards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `storeProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`storeType` enum('influencer','supply_chain','brand') NOT NULL DEFAULT 'influencer',
	`tiktokHandle` varchar(128),
	`instagramHandle` varchar(128),
	`youtubeHandle` varchar(128),
	`xiaohongshuHandle` varchar(128),
	`followerCount` int DEFAULT 0,
	`minOrderQuantity` int DEFAULT 1,
	`warehouseCountry` varchar(64),
	`shippingDays` int DEFAULT 7,
	`isDropshipEnabled` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `storeProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `storeProfiles_storeId_unique` UNIQUE(`storeId`)
);
--> statement-breakpoint
CREATE TABLE `supplyChainProducts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`categoryId` int,
	`basePriceUsdd` decimal(18,6) NOT NULL,
	`suggestedRetailPriceUsdd` decimal(18,6),
	`images` json,
	`stock` int NOT NULL DEFAULT 0,
	`minOrderQty` int NOT NULL DEFAULT 1,
	`weight` decimal(10,3),
	`tags` json,
	`isDropshipAvailable` int NOT NULL DEFAULT 1,
	`isActive` int NOT NULL DEFAULT 1,
	`salesCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplyChainProducts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userCredits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`balanceUsdd` decimal(18,6) NOT NULL DEFAULT '0',
	`totalEarnedUsdd` decimal(18,6) NOT NULL DEFAULT '0',
	`totalSpentUsdd` decimal(18,6) NOT NULL DEFAULT '0',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userCredits_id` PRIMARY KEY(`id`),
	CONSTRAINT `userCredits_userId_unique` UNIQUE(`userId`)
);
