CREATE TABLE `productReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`orderItemId` int NOT NULL,
	`userId` int NOT NULL,
	`productId` int,
	`storeProductId` int,
	`storeId` int,
	`rating` int NOT NULL,
	`comment` text,
	`images` json,
	`isVerifiedPurchase` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `productReviews_id` PRIMARY KEY(`id`)
);
