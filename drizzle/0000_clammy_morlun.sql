CREATE TYPE "public"."card_color" AS ENUM('silver', 'gold', 'platinum', 'black');--> statement-breakpoint
CREATE TYPE "public"."card_status" AS ENUM('pending', 'active', 'suspended', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."chat_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."deposit_status" AS ENUM('pending', 'confirmed', 'rejected', 'refunded', 'forfeited');--> statement-breakpoint
CREATE TYPE "public"."dropship_order_status" AS ENUM('pending', 'accepted', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."external_platform" AS ENUM('tiktok', 'pinduoduo', 'xiaohongshu', 'amazon', 'shein', 'taobao', 'jd', 'lazada', 'shopee', 'other');--> statement-breakpoint
CREATE TYPE "public"."group_status" AS ENUM('open', 'completed', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."group_tx_status" AS ENUM('pending', 'completed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."group_type" AS ENUM('standard', 'flash', '万人团');--> statement-breakpoint
CREATE TYPE "public"."joined_via" AS ENUM('direct', 'whatsapp', 'telegram', 'wechat', 'twitter', 'copy');--> statement-breakpoint
CREATE TYPE "public"."notif_type" AS ENUM('new_order', 'order_status', 'withdrawal_status', 'deposit_status', 'referral_reward', 'system');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending_payment', 'paid', 'shipped', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."quote_org_type" AS ENUM('ngo', 'military', 'government', 'medical', 'other');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('pending', 'reviewed', 'quoted', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."quote_urgency" AS ENUM('standard', 'urgent', 'critical');--> statement-breakpoint
CREATE TYPE "public"."referral_reward_status" AS ENUM('pending', 'confirmed', 'paid', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."repayment_status" AS ENUM('pending', 'submitted', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."store_order_status" AS ENUM('pending_payment', 'paid', 'shipped', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."store_status" AS ENUM('pending', 'active', 'suspended', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."store_type" AS ENUM('influencer', 'supply_chain', 'brand');--> statement-breakpoint
CREATE TYPE "public"."submission_type" AS ENUM('wechat_moments', 'community_trade', 'social_media', 'referral_signup');--> statement-breakpoint
CREATE TYPE "public"."usdd_tx_status" AS ENUM('pending', 'confirmed', 'rejected', 'completed');--> statement-breakpoint
CREATE TYPE "public"."usdd_tx_type" AS ENUM('deposit', 'payment', 'refund', 'reward', 'withdrawal', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."withdrawal_status" AS ENUM('pending', 'approved', 'rejected', 'paid');--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"fullName" varchar(128) NOT NULL,
	"phone" varchar(32),
	"country" varchar(64) NOT NULL,
	"state" varchar(64),
	"city" varchar(64) NOT NULL,
	"addressLine1" text NOT NULL,
	"addressLine2" text,
	"postalCode" varchar(16),
	"isDefault" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bulkDiscounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"productId" integer,
	"categoryId" integer,
	"minQty" integer NOT NULL,
	"discountPct" numeric(5, 2) NOT NULL,
	"label" varchar(128),
	"isActive" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cartItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"productId" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(64) NOT NULL,
	"nameEn" varchar(128) NOT NULL,
	"nameEs" varchar(128),
	"nameTr" varchar(128),
	"namePt" varchar(128),
	"nameAr" varchar(128),
	"nameRu" varchar(128),
	"iconUrl" text,
	"sortOrder" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "chatMessages" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"sessionId" varchar(64) NOT NULL,
	"role" "chat_role" NOT NULL,
	"content" text NOT NULL,
	"language" varchar(8) DEFAULT 'en',
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commissionRecords" (
	"id" serial PRIMARY KEY NOT NULL,
	"storeId" integer NOT NULL,
	"orderId" integer NOT NULL,
	"orderItemId" integer NOT NULL,
	"saleAmountUsdd" numeric(18, 6) NOT NULL,
	"commissionRate" numeric(5, 4) NOT NULL,
	"commissionAmountUsdd" numeric(18, 6) NOT NULL,
	"sellerEarningsUsdd" numeric(18, 6) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creatorCardConsumptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"cardId" integer NOT NULL,
	"userId" integer NOT NULL,
	"merchant" varchar(255) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" text,
	"repaymentStatus" "repayment_status" DEFAULT 'pending' NOT NULL,
	"submissionType" "submission_type",
	"contentUrl" text,
	"screenshotUrl" text,
	"contentDescription" text,
	"claimedViews" integer,
	"aiReviewScore" integer,
	"aiReviewReason" text,
	"darkRewardEarned" numeric(10, 2) DEFAULT '0' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creatorCards" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"cardNumber" varchar(24) NOT NULL,
	"cardColor" "card_color" DEFAULT 'gold' NOT NULL,
	"creditLimit" numeric(10, 2) DEFAULT '0' NOT NULL,
	"usedAmount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"status" "card_status" DEFAULT 'pending' NOT NULL,
	"totalFollowers" integer DEFAULT 0 NOT NULL,
	"aiScore" integer DEFAULT 0 NOT NULL,
	"aiReason" text,
	"socialAccounts" json,
	"expiresAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "creatorCards_userId_unique" UNIQUE("userId"),
	CONSTRAINT "creatorCards_cardNumber_unique" UNIQUE("cardNumber")
);
--> statement-breakpoint
CREATE TABLE "dropshipLinks" (
	"id" serial PRIMARY KEY NOT NULL,
	"influencerStoreId" integer NOT NULL,
	"influencerProductId" integer NOT NULL,
	"supplyChainProductId" integer NOT NULL,
	"supplyChainStoreId" integer NOT NULL,
	"markupPriceUsdd" numeric(18, 6) NOT NULL,
	"basePriceUsdd" numeric(18, 6) NOT NULL,
	"influencerMarginUsdd" numeric(18, 6) NOT NULL,
	"isActive" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dropshipOrders" (
	"id" serial PRIMARY KEY NOT NULL,
	"storeOrderId" integer NOT NULL,
	"influencerStoreId" integer NOT NULL,
	"supplyChainStoreId" integer NOT NULL,
	"supplyChainProductId" integer NOT NULL,
	"quantity" integer NOT NULL,
	"basePriceUsdd" numeric(18, 6) NOT NULL,
	"totalCostUsdd" numeric(18, 6) NOT NULL,
	"shippingName" varchar(128),
	"shippingPhone" varchar(32),
	"shippingAddress" text,
	"shippingCountry" varchar(64),
	"status" "dropship_order_status" DEFAULT 'pending' NOT NULL,
	"trackingNumber" varchar(128),
	"supplyChainNote" text,
	"shippedAt" timestamp,
	"deliveredAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exchangeRates" (
	"id" serial PRIMARY KEY NOT NULL,
	"baseCurrency" varchar(8) DEFAULT 'USDD' NOT NULL,
	"targetCurrency" varchar(8) NOT NULL,
	"rate" numeric(24, 8) NOT NULL,
	"source" varchar(64),
	"fetchedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groupBuyParticipants" (
	"id" serial PRIMARY KEY NOT NULL,
	"groupBuyId" integer NOT NULL,
	"userId" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"lockedPrice" numeric(18, 4) NOT NULL,
	"discountPct" numeric(5, 2) NOT NULL,
	"joinedVia" "joined_via" DEFAULT 'direct' NOT NULL,
	"referrerId" integer,
	"txStatus" "group_tx_status" DEFAULT 'pending' NOT NULL,
	"orderId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groupBuys" (
	"id" serial PRIMARY KEY NOT NULL,
	"productId" integer,
	"productName" varchar(255) NOT NULL,
	"productSlug" varchar(255),
	"originalPrice" numeric(18, 4) NOT NULL,
	"groupType" "group_type" DEFAULT 'standard' NOT NULL,
	"targetCount" integer DEFAULT 10 NOT NULL,
	"currentCount" integer DEFAULT 0 NOT NULL,
	"status" "group_status" DEFAULT 'open' NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"completedAt" timestamp,
	"creatorId" integer NOT NULL,
	"shareToken" varchar(32) NOT NULL,
	"priceTiers" json,
	"imageUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "groupBuys_shareToken_unique" UNIQUE("shareToken")
);
--> statement-breakpoint
CREATE TABLE "lowStockThresholds" (
	"id" serial PRIMARY KEY NOT NULL,
	"productId" integer NOT NULL,
	"threshold" integer DEFAULT 10 NOT NULL,
	"lastNotifiedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lowStockThresholds_productId_unique" UNIQUE("productId")
);
--> statement-breakpoint
CREATE TABLE "orderItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" integer NOT NULL,
	"productId" integer NOT NULL,
	"productName" varchar(256) NOT NULL,
	"productImage" text,
	"quantity" integer NOT NULL,
	"unitPriceUsdd" numeric(18, 6) NOT NULL,
	"subtotalUsdd" numeric(18, 6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"orderNumber" varchar(32) NOT NULL,
	"status" "order_status" DEFAULT 'pending_payment' NOT NULL,
	"totalUsdd" numeric(18, 6) NOT NULL,
	"shippingAddress" json,
	"paymentMethod" varchar(32) DEFAULT 'usdd',
	"paymentTxHash" varchar(128),
	"paymentConfirmedAt" timestamp,
	"shippedAt" timestamp,
	"completedAt" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_orderNumber_unique" UNIQUE("orderNumber")
);
--> statement-breakpoint
CREATE TABLE "paymentConfigs" (
	"id" serial PRIMARY KEY NOT NULL,
	"method" varchar(32) NOT NULL,
	"accountName" varchar(100),
	"accountNumber" varchar(100),
	"qrCodeUrl" text,
	"isEnabled" integer DEFAULT 1 NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "paymentConfigs_method_unique" UNIQUE("method")
);
--> statement-breakpoint
CREATE TABLE "platformConfig" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(64) NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platformConfig_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "productEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"storeProductId" integer NOT NULL,
	"eventType" varchar(32) NOT NULL,
	"userId" integer,
	"amountUsdd" numeric(18, 6),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "productReviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" integer NOT NULL,
	"orderItemId" integer NOT NULL,
	"userId" integer NOT NULL,
	"productId" integer,
	"storeProductId" integer,
	"storeId" integer,
	"rating" integer NOT NULL,
	"comment" text,
	"images" json,
	"isVerifiedPurchase" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"categoryId" integer,
	"slug" varchar(128) NOT NULL,
	"nameEn" varchar(256) NOT NULL,
	"nameEs" varchar(256),
	"nameTr" varchar(256),
	"namePt" varchar(256),
	"nameAr" varchar(256),
	"nameRu" varchar(256),
	"descriptionEn" text,
	"descriptionEs" text,
	"descriptionTr" text,
	"descriptionPt" text,
	"descriptionAr" text,
	"descriptionRu" text,
	"priceUsdd" numeric(18, 6) NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"images" json,
	"aiGeneratedImageUrl" text,
	"tags" json,
	"isActive" integer DEFAULT 1 NOT NULL,
	"isFeatured" integer DEFAULT 0 NOT NULL,
	"weight" numeric(10, 3),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "quoteRequests" (
	"id" serial PRIMARY KEY NOT NULL,
	"orgName" varchar(256) NOT NULL,
	"contactName" varchar(128) NOT NULL,
	"contactEmail" varchar(320) NOT NULL,
	"contactPhone" varchar(64),
	"orgType" "quote_org_type" NOT NULL,
	"deliveryCountry" varchar(64) NOT NULL,
	"deliveryCity" varchar(128),
	"deliveryAddress" text,
	"items" json NOT NULL,
	"estimatedTotalUsdd" numeric(18, 2),
	"urgency" "quote_urgency" DEFAULT 'standard' NOT NULL,
	"notes" text,
	"status" "quote_status" DEFAULT 'pending' NOT NULL,
	"adminNotes" text,
	"quotedPriceUsdd" numeric(18, 2),
	"userId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referralCodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"code" varchar(16) NOT NULL,
	"totalReferrals" integer DEFAULT 0 NOT NULL,
	"totalRewardsUsdd" numeric(18, 6) DEFAULT '0' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referralCodes_userId_unique" UNIQUE("userId"),
	CONSTRAINT "referralCodes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "referralRelations" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"referredByUserId" integer NOT NULL,
	"l2UserId" integer,
	"l3UserId" integer,
	"referralCode" varchar(16) NOT NULL,
	"firstPurchaseDone" integer DEFAULT 0 NOT NULL,
	"firstPurchaseAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referralRelations_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "referralRewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"beneficiaryUserId" integer NOT NULL,
	"referredUserId" integer NOT NULL,
	"orderId" integer NOT NULL,
	"level" integer NOT NULL,
	"orderAmountUsdd" numeric(18, 6) NOT NULL,
	"rewardRate" numeric(5, 4) NOT NULL,
	"rewardAmountUsdd" numeric(18, 6) NOT NULL,
	"status" "referral_reward_status" DEFAULT 'pending' NOT NULL,
	"paidAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storeDeposits" (
	"id" serial PRIMARY KEY NOT NULL,
	"storeId" integer NOT NULL,
	"userId" integer NOT NULL,
	"amountUsdd" numeric(18, 6) NOT NULL,
	"status" "deposit_status" DEFAULT 'pending' NOT NULL,
	"paymentMethod" varchar(32),
	"paymentTxHash" varchar(128),
	"confirmedAt" timestamp,
	"refundedAt" timestamp,
	"adminNote" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storeOrders" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" integer NOT NULL,
	"storeId" integer NOT NULL,
	"subtotalUsdd" numeric(18, 6) NOT NULL,
	"commissionUsdd" numeric(18, 6) NOT NULL,
	"sellerEarningsUsdd" numeric(18, 6) NOT NULL,
	"status" "store_order_status" DEFAULT 'pending_payment' NOT NULL,
	"trackingNumber" varchar(128),
	"shippedAt" timestamp,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storeProducts" (
	"id" serial PRIMARY KEY NOT NULL,
	"storeId" integer NOT NULL,
	"categoryId" integer,
	"slug" varchar(128) NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text,
	"priceUsdd" numeric(18, 6) NOT NULL,
	"originalPriceUsdd" numeric(18, 6),
	"stock" integer DEFAULT 0 NOT NULL,
	"images" json,
	"tags" json,
	"weight" numeric(10, 3),
	"isActive" integer DEFAULT 1 NOT NULL,
	"isFeatured" integer DEFAULT 0 NOT NULL,
	"externalPlatform" "external_platform",
	"externalUrl" text,
	"externalProductId" varchar(256),
	"salesCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "storeProducts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "storeProfiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"storeId" integer NOT NULL,
	"storeType" "store_type" DEFAULT 'influencer' NOT NULL,
	"tiktokHandle" varchar(128),
	"instagramHandle" varchar(128),
	"youtubeHandle" varchar(128),
	"xiaohongshuHandle" varchar(128),
	"followerCount" integer DEFAULT 0,
	"minOrderQuantity" integer DEFAULT 1,
	"warehouseCountry" varchar(64),
	"shippingDays" integer DEFAULT 7,
	"isDropshipEnabled" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "storeProfiles_storeId_unique" UNIQUE("storeId")
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"slug" varchar(128) NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" text,
	"logoUrl" text,
	"bannerUrl" text,
	"contactEmail" varchar(320),
	"contactPhone" varchar(32),
	"country" varchar(64),
	"status" "store_status" DEFAULT 'pending' NOT NULL,
	"commissionRate" numeric(5, 4),
	"totalEarningsUsdd" numeric(18, 6) DEFAULT '0' NOT NULL,
	"pendingBalanceUsdd" numeric(18, 6) DEFAULT '0' NOT NULL,
	"adminNote" text,
	"approvedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stores_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "supplyChainProducts" (
	"id" serial PRIMARY KEY NOT NULL,
	"storeId" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text,
	"categoryId" integer,
	"basePriceUsdd" numeric(18, 6) NOT NULL,
	"suggestedRetailPriceUsdd" numeric(18, 6),
	"images" json,
	"stock" integer DEFAULT 0 NOT NULL,
	"minOrderQty" integer DEFAULT 1 NOT NULL,
	"weight" numeric(10, 3),
	"tags" json,
	"isDropshipAvailable" integer DEFAULT 1 NOT NULL,
	"isActive" integer DEFAULT 1 NOT NULL,
	"salesCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usddTransactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"type" "usdd_tx_type" NOT NULL,
	"amountUsdd" numeric(18, 6) NOT NULL,
	"balanceAfterUsdd" numeric(18, 6) NOT NULL,
	"orderId" integer,
	"depositScreenshotUrl" text,
	"txHash" varchar(128),
	"status" "usdd_tx_status" DEFAULT 'pending' NOT NULL,
	"note" text,
	"adminNote" text,
	"confirmedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usddWallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"balanceUsdd" numeric(18, 6) DEFAULT '0' NOT NULL,
	"totalDepositedUsdd" numeric(18, 6) DEFAULT '0' NOT NULL,
	"totalSpentUsdd" numeric(18, 6) DEFAULT '0' NOT NULL,
	"depositAddress" varchar(64),
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "usddWallets_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "userCredits" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"balanceUsdd" numeric(18, 6) DEFAULT '0' NOT NULL,
	"totalEarnedUsdd" numeric(18, 6) DEFAULT '0' NOT NULL,
	"totalSpentUsdd" numeric(18, 6) DEFAULT '0' NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "userCredits_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "userNotifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"type" "notif_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"link" varchar(500),
	"isRead" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"preferredLanguage" varchar(8) DEFAULT 'en',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "withdrawalRequests" (
	"id" serial PRIMARY KEY NOT NULL,
	"storeId" integer NOT NULL,
	"userId" integer NOT NULL,
	"amountUsdd" numeric(18, 6) NOT NULL,
	"walletAddress" varchar(64) NOT NULL,
	"status" "withdrawal_status" DEFAULT 'pending' NOT NULL,
	"txHash" varchar(128),
	"adminNote" text,
	"rejectionReason" text,
	"approvedAt" timestamp,
	"paidAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
