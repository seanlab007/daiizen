import {
  decimal,
  integer,
  json,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment",
  "paid",
  "shipped",
  "completed",
  "cancelled",
]);
export const chatRoleEnum = pgEnum("chat_role", ["user", "assistant"]);

// Business enums
export const storeStatusEnum = pgEnum("store_status", ["pending", "active", "suspended", "rejected"]);
export const storeTypeEnum = pgEnum("store_type", ["influencer", "supply_chain", "brand"]);
export const externalPlatformEnum = pgEnum("external_platform", [
  "tiktok", "pinduoduo", "xiaohongshu", "amazon", "shein", "taobao", "jd", "lazada", "shopee", "other"
]);
export const depositStatusEnum = pgEnum("deposit_status", ["pending", "confirmed", "rejected", "refunded", "forfeited"]);
export const storeOrderStatusEnum = pgEnum("store_order_status", ["pending_payment", "paid", "shipped", "completed", "cancelled"]);
export const usddTxTypeEnum = pgEnum("usdd_tx_type", ["deposit", "payment", "refund", "reward", "withdrawal", "adjustment"]);
export const usddTxStatusEnum = pgEnum("usdd_tx_status", ["pending", "confirmed", "rejected", "completed"]);
export const withdrawalStatusEnum = pgEnum("withdrawal_status", ["pending", "approved", "rejected", "paid"]);
export const notifTypeEnum = pgEnum("notif_type", ["new_order", "order_status", "withdrawal_status", "deposit_status", "referral_reward", "system"]);
export const referralRewardStatusEnum = pgEnum("referral_reward_status", ["pending", "confirmed", "paid", "cancelled"]);
export const dropshipOrderStatusEnum = pgEnum("dropship_order_status", ["pending", "accepted", "shipped", "delivered", "cancelled"]);
export const quoteOrgTypeEnum = pgEnum("quote_org_type", ["ngo", "military", "government", "medical", "other"]);
export const quoteUrgencyEnum = pgEnum("quote_urgency", ["standard", "urgent", "critical"]);
export const quoteStatusEnum = pgEnum("quote_status", ["pending", "reviewed", "quoted", "accepted", "rejected"]);
export const groupTypeEnum = pgEnum("group_type", ["standard", "flash", "万人团"]);
export const groupStatusEnum = pgEnum("group_status", ["open", "completed", "expired", "cancelled"]);
export const joinedViaEnum = pgEnum("joined_via", ["direct", "whatsapp", "telegram", "wechat", "twitter", "copy"]);
export const groupTxStatusEnum = pgEnum("group_tx_status", ["pending", "completed", "refunded"]);
export const cardColorEnum = pgEnum("card_color", ["silver", "gold", "platinum", "black"]);
export const cardStatusEnum = pgEnum("card_status", ["pending", "active", "suspended", "rejected"]);
export const repaymentStatusEnum = pgEnum("repayment_status", ["pending", "submitted", "approved", "rejected"]);
export const submissionTypeEnum = pgEnum("submission_type", ["wechat_moments", "community_trade", "social_media", "referral_signup"]);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  preferredLanguage: varchar("preferredLanguage", { length: 8 }).default("en"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Shipping Addresses ───────────────────────────────────────────────────────

export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  fullName: varchar("fullName", { length: 128 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  country: varchar("country", { length: 64 }).notNull(),
  state: varchar("state", { length: 64 }),
  city: varchar("city", { length: 64 }).notNull(),
  addressLine1: text("addressLine1").notNull(),
  addressLine2: text("addressLine2"),
  postalCode: varchar("postalCode", { length: 16 }),
  isDefault: integer("isDefault").default(0).notNull(), // 0 | 1
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Address = typeof addresses.$inferSelect;
export type InsertAddress = typeof addresses.$inferInsert;

// ─── Categories ───────────────────────────────────────────────────────────────

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  nameEn: varchar("nameEn", { length: 128 }).notNull(),
  nameEs: varchar("nameEs", { length: 128 }),
  nameTr: varchar("nameTr", { length: 128 }),
  namePt: varchar("namePt", { length: 128 }),
  nameAr: varchar("nameAr", { length: 128 }),
  nameRu: varchar("nameRu", { length: 128 }),
  iconUrl: text("iconUrl"),
  sortOrder: integer("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// ─── Products ─────────────────────────────────────────────────────────────────

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  categoryId: integer("categoryId"),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  nameEn: varchar("nameEn", { length: 256 }).notNull(),
  nameEs: varchar("nameEs", { length: 256 }),
  nameTr: varchar("nameTr", { length: 256 }),
  namePt: varchar("namePt", { length: 256 }),
  nameAr: varchar("nameAr", { length: 256 }),
  nameRu: varchar("nameRu", { length: 256 }),
  descriptionEn: text("descriptionEn"),
  descriptionEs: text("descriptionEs"),
  descriptionTr: text("descriptionTr"),
  descriptionPt: text("descriptionPt"),
  descriptionAr: text("descriptionAr"),
  descriptionRu: text("descriptionRu"),
  priceUsdd: decimal("priceUsdd", { precision: 18, scale: 6 }).notNull(),
  stock: integer("stock").default(0).notNull(),
  images: json("images").$type<string[]>(),
  aiGeneratedImageUrl: text("aiGeneratedImageUrl"),
  tags: json("tags").$type<string[]>(),
  isActive: integer("isActive").default(1).notNull(),
  isFeatured: integer("isFeatured").default(0).notNull(),
  weight: decimal("weight", { precision: 10, scale: 3 }), // kg
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ─── Cart Items ───────────────────────────────────────────────────────────────

export const cartItems = pgTable("cartItems", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  productId: integer("productId").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

// ─── Orders ───────────────────────────────────────────────────────────────────

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  orderNumber: varchar("orderNumber", { length: 32 }).notNull().unique(),
  status: orderStatusEnum("status").default("pending_payment").notNull(),
  totalUsdd: decimal("totalUsdd", { precision: 18, scale: 6 }).notNull(),
  shippingAddress: json("shippingAddress").$type<{
    fullName: string;
    phone?: string;
    country: string;
    state?: string;
    city: string;
    addressLine1: string;
    addressLine2?: string;
    postalCode?: string;
  }>(),
  paymentMethod: varchar("paymentMethod", { length: 32 }).default("usdd"),
  paymentTxHash: varchar("paymentTxHash", { length: 128 }),
  paymentConfirmedAt: timestamp("paymentConfirmedAt"),
  shippedAt: timestamp("shippedAt"),
  completedAt: timestamp("completedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ─── Order Items ──────────────────────────────────────────────────────────────

export const orderItems = pgTable("orderItems", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  productId: integer("productId").notNull(),
  productName: varchar("productName", { length: 256 }).notNull(),
  productImage: text("productImage"),
  quantity: integer("quantity").notNull(),
  unitPriceUsdd: decimal("unitPriceUsdd", { precision: 18, scale: 6 }).notNull(),
  subtotalUsdd: decimal("subtotalUsdd", { precision: 18, scale: 6 }).notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// ─── Exchange Rates ───────────────────────────────────────────────────────────

export const exchangeRates = pgTable("exchangeRates", {
  id: serial("id").primaryKey(),
  baseCurrency: varchar("baseCurrency", { length: 8 }).notNull().default("USDD"),
  targetCurrency: varchar("targetCurrency", { length: 8 }).notNull(),
  rate: decimal("rate", { precision: 24, scale: 8 }).notNull(),
  source: varchar("source", { length: 64 }),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
});

export type ExchangeRate = typeof exchangeRates.$inferSelect;

// ─── Chat Messages ────────────────────────────────────────────────────────────

export const chatMessages = pgTable("chatMessages", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  role: chatRoleEnum("role").notNull(),
  content: text("content").notNull(),
  language: varchar("language", { length: 8 }).default("en"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;

// ─── Stores (Seller Shops) ────────────────────────────────────────────────────

export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  logoUrl: text("logoUrl"),
  bannerUrl: text("bannerUrl"),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 32 }),
  country: varchar("country", { length: 64 }),
  status: storeStatusEnum("status").default("pending").notNull(),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 4 }),
  totalEarningsUsdd: decimal("totalEarningsUsdd", { precision: 18, scale: 6 }).default("0").notNull(),
  pendingBalanceUsdd: decimal("pendingBalanceUsdd", { precision: 18, scale: 6 }).default("0").notNull(),
  adminNote: text("adminNote"),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Store = typeof stores.$inferSelect;
export type InsertStore = typeof stores.$inferInsert;

// ─── Store Products ───────────────────────────────────────────────────────────

export const storeProducts = pgTable("storeProducts", {
  id: serial("id").primaryKey(),
  storeId: integer("storeId").notNull(),
  categoryId: integer("categoryId"),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  priceUsdd: decimal("priceUsdd", { precision: 18, scale: 6 }).notNull(),
  originalPriceUsdd: decimal("originalPriceUsdd", { precision: 18, scale: 6 }),
  stock: integer("stock").default(0).notNull(),
  images: json("images").$type<string[]>(),
  tags: json("tags").$type<string[]>(),
  weight: decimal("weight", { precision: 10, scale: 3 }),
  isActive: integer("isActive").default(1).notNull(),
  isFeatured: integer("isFeatured").default(0).notNull(),
  externalPlatform: externalPlatformEnum("externalPlatform"),
  externalUrl: text("externalUrl"),
  externalProductId: varchar("externalProductId", { length: 256 }),
  salesCount: integer("salesCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type StoreProduct = typeof storeProducts.$inferSelect;
export type InsertStoreProduct = typeof storeProducts.$inferInsert;

// ─── Store Deposits ───────────────────────────────────────────────────────────

export const storeDeposits = pgTable("storeDeposits", {
  id: serial("id").primaryKey(),
  storeId: integer("storeId").notNull(),
  userId: integer("userId").notNull(),
  amountUsdd: decimal("amountUsdd", { precision: 18, scale: 6 }).notNull(),
  status: depositStatusEnum("status").default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 32 }),
  paymentTxHash: varchar("paymentTxHash", { length: 128 }),
  confirmedAt: timestamp("confirmedAt"),
  refundedAt: timestamp("refundedAt"),
  adminNote: text("adminNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type StoreDeposit = typeof storeDeposits.$inferSelect;
export type InsertStoreDeposit = typeof storeDeposits.$inferInsert;

// ─── Platform Commission Config ───────────────────────────────────────────────

export const platformConfig = pgTable("platformConfig", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PlatformConfig = typeof platformConfig.$inferSelect;

// ─── Commission Records ───────────────────────────────────────────────────────

export const commissionRecords = pgTable("commissionRecords", {
  id: serial("id").primaryKey(),
  storeId: integer("storeId").notNull(),
  orderId: integer("orderId").notNull(),
  orderItemId: integer("orderItemId").notNull(),
  saleAmountUsdd: decimal("saleAmountUsdd", { precision: 18, scale: 6 }).notNull(),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 4 }).notNull(),
  commissionAmountUsdd: decimal("commissionAmountUsdd", { precision: 18, scale: 6 }).notNull(),
  sellerEarningsUsdd: decimal("sellerEarningsUsdd", { precision: 18, scale: 6 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommissionRecord = typeof commissionRecords.$inferSelect;
export type InsertCommissionRecord = typeof commissionRecords.$inferInsert;

// ─── Store Orders ─────────────────────────────────────────────────────────────

export const storeOrders = pgTable("storeOrders", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  storeId: integer("storeId").notNull(),
  subtotalUsdd: decimal("subtotalUsdd", { precision: 18, scale: 6 }).notNull(),
  commissionUsdd: decimal("commissionUsdd", { precision: 18, scale: 6 }).notNull(),
  sellerEarningsUsdd: decimal("sellerEarningsUsdd", { precision: 18, scale: 6 }).notNull(),
  status: storeOrderStatusEnum("status").default("pending_payment").notNull(),
  trackingNumber: varchar("trackingNumber", { length: 128 }),
  shippedAt: timestamp("shippedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type StoreOrder = typeof storeOrders.$inferSelect;
export type InsertStoreOrder = typeof storeOrders.$inferInsert;

// ─── S2B2C: Store Type Extension ──────────────────────────────────────────────

export const storeProfiles = pgTable("storeProfiles", {
  id: serial("id").primaryKey(),
  storeId: integer("storeId").notNull().unique(),
  storeType: storeTypeEnum("storeType").default("influencer").notNull(),
  tiktokHandle: varchar("tiktokHandle", { length: 128 }),
  instagramHandle: varchar("instagramHandle", { length: 128 }),
  youtubeHandle: varchar("youtubeHandle", { length: 128 }),
  xiaohongshuHandle: varchar("xiaohongshuHandle", { length: 128 }),
  followerCount: integer("followerCount").default(0),
  minOrderQuantity: integer("minOrderQuantity").default(1),
  warehouseCountry: varchar("warehouseCountry", { length: 64 }),
  shippingDays: integer("shippingDays").default(7),
  isDropshipEnabled: integer("isDropshipEnabled").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type StoreProfile = typeof storeProfiles.$inferSelect;

// ─── Referral System (3-Level Max) ───────────────────────────────────────────

export const referralCodes = pgTable("referralCodes", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  code: varchar("code", { length: 16 }).notNull().unique(),
  totalReferrals: integer("totalReferrals").default(0).notNull(),
  totalRewardsUsdd: decimal("totalRewardsUsdd", { precision: 18, scale: 6 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReferralCode = typeof referralCodes.$inferSelect;

export const referralRelations = pgTable("referralRelations", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  referredByUserId: integer("referredByUserId").notNull(),
  l2UserId: integer("l2UserId"),
  l3UserId: integer("l3UserId"),
  referralCode: varchar("referralCode", { length: 16 }).notNull(),
  firstPurchaseDone: integer("firstPurchaseDone").default(0).notNull(),
  firstPurchaseAt: timestamp("firstPurchaseAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReferralRelation = typeof referralRelations.$inferSelect;

export const referralRewards = pgTable("referralRewards", {
  id: serial("id").primaryKey(),
  beneficiaryUserId: integer("beneficiaryUserId").notNull(),
  referredUserId: integer("referredUserId").notNull(),
  orderId: integer("orderId").notNull(),
  level: integer("level").notNull(),
  orderAmountUsdd: decimal("orderAmountUsdd", { precision: 18, scale: 6 }).notNull(),
  rewardRate: decimal("rewardRate", { precision: 5, scale: 4 }).notNull(),
  rewardAmountUsdd: decimal("rewardAmountUsdd", { precision: 18, scale: 6 }).notNull(),
  status: referralRewardStatusEnum("status").default("pending").notNull(),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReferralReward = typeof referralRewards.$inferSelect;

export const userCredits = pgTable("userCredits", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  balanceUsdd: decimal("balanceUsdd", { precision: 18, scale: 6 }).default("0").notNull(),
  totalEarnedUsdd: decimal("totalEarnedUsdd", { precision: 18, scale: 6 }).default("0").notNull(),
  totalSpentUsdd: decimal("totalSpentUsdd", { precision: 18, scale: 6 }).default("0").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UserCredit = typeof userCredits.$inferSelect;

// ─── Supply Chain Catalog ─────────────────────────────────────────────────────

export const supplyChainProducts = pgTable("supplyChainProducts", {
  id: serial("id").primaryKey(),
  storeId: integer("storeId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  categoryId: integer("categoryId"),
  basePriceUsdd: decimal("basePriceUsdd", { precision: 18, scale: 6 }).notNull(),
  suggestedRetailPriceUsdd: decimal("suggestedRetailPriceUsdd", { precision: 18, scale: 6 }),
  images: json("images").$type<string[]>(),
  stock: integer("stock").default(0).notNull(),
  minOrderQty: integer("minOrderQty").default(1).notNull(),
  weight: decimal("weight", { precision: 10, scale: 3 }),
  tags: json("tags").$type<string[]>(),
  isDropshipAvailable: integer("isDropshipAvailable").default(1).notNull(),
  isActive: integer("isActive").default(1).notNull(),
  salesCount: integer("salesCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SupplyChainProduct = typeof supplyChainProducts.$inferSelect;

export const dropshipLinks = pgTable("dropshipLinks", {
  id: serial("id").primaryKey(),
  influencerStoreId: integer("influencerStoreId").notNull(),
  influencerProductId: integer("influencerProductId").notNull(),
  supplyChainProductId: integer("supplyChainProductId").notNull(),
  supplyChainStoreId: integer("supplyChainStoreId").notNull(),
  markupPriceUsdd: decimal("markupPriceUsdd", { precision: 18, scale: 6 }).notNull(),
  basePriceUsdd: decimal("basePriceUsdd", { precision: 18, scale: 6 }).notNull(),
  influencerMarginUsdd: decimal("influencerMarginUsdd", { precision: 18, scale: 6 }).notNull(),
  isActive: integer("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DropshipLink = typeof dropshipLinks.$inferSelect;

export const dropshipOrders = pgTable("dropshipOrders", {
  id: serial("id").primaryKey(),
  storeOrderId: integer("storeOrderId").notNull(),
  influencerStoreId: integer("influencerStoreId").notNull(),
  supplyChainStoreId: integer("supplyChainStoreId").notNull(),
  supplyChainProductId: integer("supplyChainProductId").notNull(),
  quantity: integer("quantity").notNull(),
  basePriceUsdd: decimal("basePriceUsdd", { precision: 18, scale: 6 }).notNull(),
  totalCostUsdd: decimal("totalCostUsdd", { precision: 18, scale: 6 }).notNull(),
  shippingName: varchar("shippingName", { length: 128 }),
  shippingPhone: varchar("shippingPhone", { length: 32 }),
  shippingAddress: text("shippingAddress"),
  shippingCountry: varchar("shippingCountry", { length: 64 }),
  status: dropshipOrderStatusEnum("status").default("pending").notNull(),
  trackingNumber: varchar("trackingNumber", { length: 128 }),
  supplyChainNote: text("supplyChainNote"),
  shippedAt: timestamp("shippedAt"),
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type DropshipOrder = typeof dropshipOrders.$inferSelect;

// ─── USDD Wallet System ───────────────────────────────────────────────────────

export const usddWallets = pgTable("usddWallets", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  balanceUsdd: decimal("balanceUsdd", { precision: 18, scale: 6 }).default("0").notNull(),
  totalDepositedUsdd: decimal("totalDepositedUsdd", { precision: 18, scale: 6 }).default("0").notNull(),
  totalSpentUsdd: decimal("totalSpentUsdd", { precision: 18, scale: 6 }).default("0").notNull(),
  depositAddress: varchar("depositAddress", { length: 64 }),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UsddWallet = typeof usddWallets.$inferSelect;

export const usddTransactions = pgTable("usddTransactions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  type: usddTxTypeEnum("type").notNull(),
  amountUsdd: decimal("amountUsdd", { precision: 18, scale: 6 }).notNull(),
  balanceAfterUsdd: decimal("balanceAfterUsdd", { precision: 18, scale: 6 }).notNull(),
  orderId: integer("orderId"),
  depositScreenshotUrl: text("depositScreenshotUrl"),
  txHash: varchar("txHash", { length: 128 }),
  status: usddTxStatusEnum("status").default("pending").notNull(),
  note: text("note"),
  adminNote: text("adminNote"),
  confirmedAt: timestamp("confirmedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UsddTransaction = typeof usddTransactions.$inferSelect;

// ─── Seller Withdrawal Requests ───────────────────────────────────────────────

export const withdrawalRequests = pgTable("withdrawalRequests", {
  id: serial("id").primaryKey(),
  storeId: integer("storeId").notNull(),
  userId: integer("userId").notNull(),
  amountUsdd: decimal("amountUsdd", { precision: 18, scale: 6 }).notNull(),
  walletAddress: varchar("walletAddress", { length: 64 }).notNull(),
  status: withdrawalStatusEnum("status").default("pending").notNull(),
  txHash: varchar("txHash", { length: 128 }),
  adminNote: text("adminNote"),
  rejectionReason: text("rejectionReason"),
  approvedAt: timestamp("approvedAt"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;

// ─── Product Reviews ──────────────────────────────────────────────────────────

export const productReviews = pgTable("productReviews", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  orderItemId: integer("orderItemId").notNull(),
  userId: integer("userId").notNull(),
  productId: integer("productId"),
  storeProductId: integer("storeProductId"),
  storeId: integer("storeId"),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  images: json("images").$type<string[]>(),
  isVerifiedPurchase: integer("isVerifiedPurchase").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ProductReview = typeof productReviews.$inferSelect;
export type InsertProductReview = typeof productReviews.$inferInsert;

// ─── User Notifications ───────────────────────────────────────────────────────

export const userNotifications = pgTable("userNotifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  type: notifTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  link: varchar("link", { length: 500 }),
  isRead: integer("isRead").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserNotification = typeof userNotifications.$inferSelect;
export type InsertUserNotification = typeof userNotifications.$inferInsert;

// ─── Bulk Purchase Discounts ──────────────────────────────────────────────────

export const bulkDiscounts = pgTable("bulkDiscounts", {
  id: serial("id").primaryKey(),
  productId: integer("productId"),
  categoryId: integer("categoryId"),
  minQty: integer("minQty").notNull(),
  discountPct: decimal("discountPct", { precision: 5, scale: 2 }).notNull(),
  label: varchar("label", { length: 128 }),
  isActive: integer("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BulkDiscount = typeof bulkDiscounts.$inferSelect;
export type InsertBulkDiscount = typeof bulkDiscounts.$inferInsert;

// ─── Low Stock Thresholds ─────────────────────────────────────────────────────

export const lowStockThresholds = pgTable("lowStockThresholds", {
  id: serial("id").primaryKey(),
  productId: integer("productId").notNull().unique(),
  threshold: integer("threshold").notNull().default(10),
  lastNotifiedAt: timestamp("lastNotifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type LowStockThreshold = typeof lowStockThresholds.$inferSelect;

// ─── Bulk Quote Requests ──────────────────────────────────────────────────────

export const quoteRequests = pgTable("quoteRequests", {
  id: serial("id").primaryKey(),
  orgName: varchar("orgName", { length: 256 }).notNull(),
  contactName: varchar("contactName", { length: 128 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 64 }),
  orgType: quoteOrgTypeEnum("orgType").notNull(),
  deliveryCountry: varchar("deliveryCountry", { length: 64 }).notNull(),
  deliveryCity: varchar("deliveryCity", { length: 128 }),
  deliveryAddress: text("deliveryAddress"),
  items: json("items").notNull(),
  estimatedTotalUsdd: decimal("estimatedTotalUsdd", { precision: 18, scale: 2 }),
  urgency: quoteUrgencyEnum("urgency").default("standard").notNull(),
  notes: text("notes"),
  status: quoteStatusEnum("status").default("pending").notNull(),
  adminNotes: text("adminNotes"),
  quotedPriceUsdd: decimal("quotedPriceUsdd", { precision: 18, scale: 2 }),
  userId: integer("userId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type InsertQuoteRequest = typeof quoteRequests.$inferInsert;

// ─── Group Buy (拼团) ─────────────────────────────────────────────────────────

export const groupBuys = pgTable("groupBuys", {
  id: serial("id").primaryKey(),
  productId: integer("productId"),
  productName: varchar("productName", { length: 255 }).notNull(),
  productSlug: varchar("productSlug", { length: 255 }),
  originalPrice: decimal("originalPrice", { precision: 18, scale: 4 }).notNull(),
  groupType: groupTypeEnum("groupType").default("standard").notNull(),
  targetCount: integer("targetCount").default(10).notNull(),
  currentCount: integer("currentCount").default(0).notNull(),
  status: groupStatusEnum("status").default("open").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  completedAt: timestamp("completedAt"),
  creatorId: integer("creatorId").notNull(),
  shareToken: varchar("shareToken", { length: 32 }).notNull().unique(),
  priceTiers: json("priceTiers"),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type GroupBuy = typeof groupBuys.$inferSelect;
export type InsertGroupBuy = typeof groupBuys.$inferInsert;

export const groupBuyParticipants = pgTable("groupBuyParticipants", {
  id: serial("id").primaryKey(),
  groupBuyId: integer("groupBuyId").notNull(),
  userId: integer("userId").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  lockedPrice: decimal("lockedPrice", { precision: 18, scale: 4 }).notNull(),
  discountPct: decimal("discountPct", { precision: 5, scale: 2 }).notNull(),
  joinedVia: joinedViaEnum("joinedVia").default("direct").notNull(),
  referrerId: integer("referrerId"),
  txStatus: groupTxStatusEnum("txStatus").default("pending").notNull(),
  orderId: integer("orderId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GroupBuyParticipant = typeof groupBuyParticipants.$inferSelect;

// ─── Creator Card ─────────────────────────────────────────────────────────────

export const creatorCards = pgTable("creatorCards", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  cardNumber: varchar("cardNumber", { length: 24 }).notNull().unique(),
  cardColor: cardColorEnum("cardColor").default("gold").notNull(),
  creditLimit: decimal("creditLimit", { precision: 10, scale: 2 }).default("0").notNull(),
  usedAmount: decimal("usedAmount", { precision: 10, scale: 2 }).default("0").notNull(),
  status: cardStatusEnum("status").default("pending").notNull(),
  totalFollowers: integer("totalFollowers").default(0).notNull(),
  aiScore: integer("aiScore").default(0).notNull(),
  aiReason: text("aiReason"),
  socialAccounts: json("socialAccounts"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CreatorCard = typeof creatorCards.$inferSelect;
export type InsertCreatorCard = typeof creatorCards.$inferInsert;

export const creatorCardConsumptions = pgTable("creatorCardConsumptions", {
  id: serial("id").primaryKey(),
  cardId: integer("cardId").notNull(),
  userId: integer("userId").notNull(),
  merchant: varchar("merchant", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  repaymentStatus: repaymentStatusEnum("repaymentStatus").default("pending").notNull(),
  submissionType: submissionTypeEnum("submissionType"),
  contentUrl: text("contentUrl"),
  screenshotUrl: text("screenshotUrl"),
  contentDescription: text("contentDescription"),
  claimedViews: integer("claimedViews"),
  aiReviewScore: integer("aiReviewScore"),
  aiReviewReason: text("aiReviewReason"),
  darkRewardEarned: decimal("darkRewardEarned", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CreatorCardConsumption = typeof creatorCardConsumptions.$inferSelect;

// ─── Payment Configs ──────────────────────────────────────────────────────────

export const paymentConfigs = pgTable("paymentConfigs", {
  id: serial("id").primaryKey(),
  method: varchar("method", { length: 32 }).notNull().unique(), // "usdd" | "dark"
  accountName: varchar("accountName", { length: 100 }),
  accountNumber: varchar("accountNumber", { length: 100 }),
  qrCodeUrl: text("qrCodeUrl"),
  isEnabled: integer("isEnabled").default(1).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PaymentConfig = typeof paymentConfigs.$inferSelect;

// ─── Product Events (Analytics) ───────────────────────────────────────────────

export const productEvents = pgTable("productEvents", {
  id: serial("id").primaryKey(),
  storeProductId: integer("storeProductId").notNull(),
  eventType: varchar("eventType", { length: 32 }).notNull(), // "view" | "cart_add" | "order"
  userId: integer("userId"),
  amountUsdd: decimal("amountUsdd", { precision: 18, scale: 6 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductEvent = typeof productEvents.$inferSelect;
