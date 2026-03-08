CREATE TABLE `usddTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('deposit','payment','refund','reward','withdrawal','adjustment') NOT NULL,
	`amountUsdd` decimal(18,6) NOT NULL,
	`balanceAfterUsdd` decimal(18,6) NOT NULL,
	`orderId` int,
	`depositScreenshotUrl` text,
	`txHash` varchar(128),
	`status` enum('pending','confirmed','rejected','completed') NOT NULL DEFAULT 'pending',
	`note` text,
	`adminNote` text,
	`confirmedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `usddTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usddWallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`balanceUsdd` decimal(18,6) NOT NULL DEFAULT '0',
	`totalDepositedUsdd` decimal(18,6) NOT NULL DEFAULT '0',
	`totalSpentUsdd` decimal(18,6) NOT NULL DEFAULT '0',
	`depositAddress` varchar(64),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `usddWallets_id` PRIMARY KEY(`id`),
	CONSTRAINT `usddWallets_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `withdrawalRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`userId` int NOT NULL,
	`amountUsdd` decimal(18,6) NOT NULL,
	`walletAddress` varchar(64) NOT NULL,
	`status` enum('pending','approved','rejected','paid') NOT NULL DEFAULT 'pending',
	`txHash` varchar(128),
	`adminNote` text,
	`rejectionReason` text,
	`approvedAt` timestamp,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `withdrawalRequests_id` PRIMARY KEY(`id`)
);
