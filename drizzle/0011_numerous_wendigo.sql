CREATE TABLE `creatorCardConsumptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cardId` int NOT NULL,
	`userId` int NOT NULL,
	`merchant` varchar(255) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`description` text,
	`repaymentStatus` enum('pending','submitted','approved','rejected') NOT NULL DEFAULT 'pending',
	`submissionType` enum('wechat_moments','community_trade','social_media','referral_signup'),
	`contentUrl` text,
	`screenshotUrl` text,
	`contentDescription` text,
	`claimedViews` int,
	`aiReviewScore` int,
	`aiReviewReason` text,
	`darkRewardEarned` decimal(10,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `creatorCardConsumptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creatorCards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cardNumber` varchar(24) NOT NULL,
	`cardColor` enum('silver','gold','platinum','black') NOT NULL DEFAULT 'gold',
	`creditLimit` decimal(10,2) NOT NULL DEFAULT '0',
	`usedAmount` decimal(10,2) NOT NULL DEFAULT '0',
	`status` enum('pending','active','suspended','rejected') NOT NULL DEFAULT 'pending',
	`totalFollowers` int NOT NULL DEFAULT 0,
	`aiScore` int NOT NULL DEFAULT 0,
	`aiReason` text,
	`socialAccounts` json,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `creatorCards_id` PRIMARY KEY(`id`),
	CONSTRAINT `creatorCards_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `creatorCards_cardNumber_unique` UNIQUE(`cardNumber`)
);
--> statement-breakpoint
CREATE TABLE `groupBuyParticipants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupBuyId` int NOT NULL,
	`userId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`lockedPrice` decimal(18,4) NOT NULL,
	`discountPct` decimal(5,2) NOT NULL,
	`joinedVia` enum('direct','whatsapp','telegram','wechat','twitter','copy') NOT NULL DEFAULT 'direct',
	`referrerId` int,
	`txStatus` enum('pending','completed','refunded') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `groupBuyParticipants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `groupBuys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int,
	`productName` varchar(255) NOT NULL,
	`productSlug` varchar(255),
	`originalPrice` decimal(18,4) NOT NULL,
	`groupType` enum('standard','flash','万人团') NOT NULL DEFAULT 'standard',
	`targetCount` int NOT NULL DEFAULT 10,
	`currentCount` int NOT NULL DEFAULT 0,
	`status` enum('open','completed','expired','cancelled') NOT NULL DEFAULT 'open',
	`expiresAt` timestamp NOT NULL,
	`completedAt` timestamp,
	`creatorId` int NOT NULL,
	`shareToken` varchar(32) NOT NULL,
	`priceTiers` json,
	`imageUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `groupBuys_id` PRIMARY KEY(`id`),
	CONSTRAINT `groupBuys_shareToken_unique` UNIQUE(`shareToken`)
);
