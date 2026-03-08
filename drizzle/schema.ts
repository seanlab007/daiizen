import {
  bigint,
  decimal,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  phoneNumber: varchar("phoneNumber", { length: 32 }),
  telegramId: varchar("telegramId", { length: 64 }),
  googleId: varchar("googleId", { length: 128 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  preferredLanguage: varchar("preferredLanguage", { length: 8 }).default("en"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Shipping Addresses ───────────────────────────────────────────────────────

export const addresses = mysqlTable("addresses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fullName: varchar("fullName", { length: 128 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  country: varchar("country", { length: 64 }).notNull(),
  state: varchar("state", { length: 64 }),
  city: varchar("city", { length: 64 }).notNull(),
  addressLine1: text("addressLine1").notNull(),
  addressLine2: text("addressLine2"),
  postalCode: varchar("postalCode", { length: 16 }),
  isDefault: int("isDefault").default(0).notNull(), // 0 | 1
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Address = typeof addresses.$inferSelect;
export type InsertAddress = typeof addresses.$inferInsert;

// ─── Categories ───────────────────────────────────────────────────────────────

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  nameEn: varchar("nameEn", { length: 128 }).notNull(),
  nameEs: varchar("nameEs", { length: 128 }),
  nameTr: varchar("nameTr", { length: 128 }),
  namePt: varchar("namePt", { length: 128 }),
  nameAr: varchar("nameAr", { length: 128 }),
  nameRu: varchar("nameRu", { length: 128 }),
  iconUrl: text("iconUrl"),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// ─── Products ─────────────────────────────────────────────────────────────────

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId"),
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
  stock: int("stock").default(0).notNull(),
  images: json("images").$type<string[]>(),
  aiGeneratedImageUrl: text("aiGeneratedImageUrl"),
  tags: json("tags").$type<string[]>(),
  isActive: int("isActive").default(1).notNull(),
  isFeatured: int("isFeatured").default(0).notNull(),
  weight: decimal("weight", { precision: 10, scale: 3 }), // kg
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ─── Cart Items ───────────────────────────────────────────────────────────────

export const cartItems = mysqlTable("cartItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

// ─── Orders ───────────────────────────────────────────────────────────────────

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  orderNumber: varchar("orderNumber", { length: 32 }).notNull().unique(),
  status: mysqlEnum("status", ["pending_payment", "paid", "shipped", "completed", "cancelled"])
    .default("pending_payment")
    .notNull(),
  totalUsdd: decimal("totalUsdd", { precision: 18, scale: 6 }).notNull(),
  // Snapshot of address at order time
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ─── Order Items ──────────────────────────────────────────────────────────────

export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  productName: varchar("productName", { length: 256 }).notNull(), // snapshot
  productImage: text("productImage"),
  quantity: int("quantity").notNull(),
  unitPriceUsdd: decimal("unitPriceUsdd", { precision: 18, scale: 6 }).notNull(),
  subtotalUsdd: decimal("subtotalUsdd", { precision: 18, scale: 6 }).notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// ─── Exchange Rates ───────────────────────────────────────────────────────────

export const exchangeRates = mysqlTable("exchangeRates", {
  id: int("id").autoincrement().primaryKey(),
  baseCurrency: varchar("baseCurrency", { length: 8 }).notNull().default("USDD"),
  targetCurrency: varchar("targetCurrency", { length: 8 }).notNull(),
  rate: decimal("rate", { precision: 24, scale: 8 }).notNull(),
  source: varchar("source", { length: 64 }),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
});

export type ExchangeRate = typeof exchangeRates.$inferSelect;

// ─── Chat Messages ────────────────────────────────────────────────────────────

export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  language: varchar("language", { length: 8 }).default("en"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;

// ─── Stores (Seller Shops) ────────────────────────────────────────────────────

export const stores = mysqlTable("stores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  logoUrl: text("logoUrl"),
  bannerUrl: text("bannerUrl"),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 32 }),
  country: varchar("country", { length: 64 }),
  // Status: pending (awaiting admin approval), active, suspended, rejected
  status: mysqlEnum("status", ["pending", "active", "suspended", "rejected"])
    .default("pending")
    .notNull(),
  // Commission rate override (null = use platform default)
  commissionRate: decimal("commissionRate", { precision: 5, scale: 4 }), // e.g. 0.0500 = 5%
  // Total earnings and balance tracking
  totalEarningsUsdd: decimal("totalEarningsUsdd", { precision: 18, scale: 6 }).default("0").notNull(),
  pendingBalanceUsdd: decimal("pendingBalanceUsdd", { precision: 18, scale: 6 }).default("0").notNull(),
  adminNote: text("adminNote"),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Store = typeof stores.$inferSelect;
export type InsertStore = typeof stores.$inferInsert;

// ─── Store Products ───────────────────────────────────────────────────────────

export const storeProducts = mysqlTable("storeProducts", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  categoryId: int("categoryId"),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  priceUsdd: decimal("priceUsdd", { precision: 18, scale: 6 }).notNull(),
  originalPriceUsdd: decimal("originalPriceUsdd", { precision: 18, scale: 6 }), // for showing discount
  stock: int("stock").default(0).notNull(),
  images: json("images").$type<string[]>(),
  tags: json("tags").$type<string[]>(),
  weight: decimal("weight", { precision: 10, scale: 3 }),
  isActive: int("isActive").default(1).notNull(),
  isFeatured: int("isFeatured").default(0).notNull(),
  // External platform link (original source)
  externalPlatform: mysqlEnum("externalPlatform", [
    "tiktok", "pinduoduo", "xiaohongshu", "amazon", "shein", "taobao", "jd", "lazada", "shopee", "other"
  ]),
  externalUrl: text("externalUrl"),
  externalProductId: varchar("externalProductId", { length: 256 }),
  // Sales stats
  salesCount: int("salesCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StoreProduct = typeof storeProducts.$inferSelect;
export type InsertStoreProduct = typeof storeProducts.$inferInsert;

// ─── Store Deposits ───────────────────────────────────────────────────────────

export const storeDeposits = mysqlTable("storeDeposits", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  userId: int("userId").notNull(),
  amountUsdd: decimal("amountUsdd", { precision: 18, scale: 6 }).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "refunded", "forfeited"])
    .default("pending")
    .notNull(),
  paymentMethod: varchar("paymentMethod", { length: 32 }),
  paymentTxHash: varchar("paymentTxHash", { length: 128 }),
  confirmedAt: timestamp("confirmedAt"),
  refundedAt: timestamp("refundedAt"),
  adminNote: text("adminNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StoreDeposit = typeof storeDeposits.$inferSelect;
export type InsertStoreDeposit = typeof storeDeposits.$inferInsert;

// ─── Platform Commission Config ───────────────────────────────────────────────

export const platformConfig = mysqlTable("platformConfig", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlatformConfig = typeof platformConfig.$inferSelect;

// ─── Commission Records ───────────────────────────────────────────────────────

export const commissionRecords = mysqlTable("commissionRecords", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  orderId: int("orderId").notNull(),
  orderItemId: int("orderItemId").notNull(),
  saleAmountUsdd: decimal("saleAmountUsdd", { precision: 18, scale: 6 }).notNull(),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 4 }).notNull(),
  commissionAmountUsdd: decimal("commissionAmountUsdd", { precision: 18, scale: 6 }).notNull(),
  sellerEarningsUsdd: decimal("sellerEarningsUsdd", { precision: 18, scale: 6 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommissionRecord = typeof commissionRecords.$inferSelect;
export type InsertCommissionRecord = typeof commissionRecords.$inferInsert;

// ─── Store Orders ─────────────────────────────────────────────────────────────
// Links platform orders to specific stores (for multi-store cart support)

export const storeOrders = mysqlTable("storeOrders", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  storeId: int("storeId").notNull(),
  subtotalUsdd: decimal("subtotalUsdd", { precision: 18, scale: 6 }).notNull(),
  commissionUsdd: decimal("commissionUsdd", { precision: 18, scale: 6 }).notNull(),
  sellerEarningsUsdd: decimal("sellerEarningsUsdd", { precision: 18, scale: 6 }).notNull(),
  status: mysqlEnum("status", ["pending_payment", "paid", "shipped", "completed", "cancelled"])
    .default("pending_payment")
    .notNull(),
  trackingNumber: varchar("trackingNumber", { length: 128 }),
  shippedAt: timestamp("shippedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StoreOrder = typeof storeOrders.$inferSelect;
export type InsertStoreOrder = typeof storeOrders.$inferInsert;

// ─── S2B2C: Store Type Extension ──────────────────────────────────────────────
// storeType added as a separate table to avoid altering existing stores table
// "influencer" = KOL/网红店, "supply_chain" = 供应链/批发商, "brand" = 品牌自营
export const storeProfiles = mysqlTable("storeProfiles", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull().unique(),
  storeType: mysqlEnum("storeType", ["influencer", "supply_chain", "brand"])
    .default("influencer")
    .notNull(),
  // For influencers: social platform links
  tiktokHandle: varchar("tiktokHandle", { length: 128 }),
  instagramHandle: varchar("instagramHandle", { length: 128 }),
  youtubeHandle: varchar("youtubeHandle", { length: 128 }),
  xiaohongshuHandle: varchar("xiaohongshuHandle", { length: 128 }),
  followerCount: int("followerCount").default(0),
  // For supply chain: wholesale info
  minOrderQuantity: int("minOrderQuantity").default(1),
  warehouseCountry: varchar("warehouseCountry", { length: 64 }),
  shippingDays: int("shippingDays").default(7),
  isDropshipEnabled: int("isDropshipEnabled").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StoreProfile = typeof storeProfiles.$inferSelect;

// ─── Referral System (3-Level Max) ───────────────────────────────────────────
// Each user has one referral code; referral tree tracks up to 3 ancestors
export const referralCodes = mysqlTable("referralCodes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  code: varchar("code", { length: 16 }).notNull().unique(),
  totalReferrals: int("totalReferrals").default(0).notNull(),
  totalRewardsUsdd: decimal("totalRewardsUsdd", { precision: 18, scale: 6 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ReferralCode = typeof referralCodes.$inferSelect;

// Tracks who referred whom, and the referral chain (up to 3 levels)
export const referralRelations = mysqlTable("referralRelations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // the new user
  referredByUserId: int("referredByUserId").notNull(), // direct referrer (L1)
  l2UserId: int("l2UserId"), // L1's referrer (L2 for original user)
  l3UserId: int("l3UserId"), // L2's referrer (L3 for original user)
  referralCode: varchar("referralCode", { length: 16 }).notNull(),
  firstPurchaseDone: int("firstPurchaseDone").default(0).notNull(),
  firstPurchaseAt: timestamp("firstPurchaseAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ReferralRelation = typeof referralRelations.$inferSelect;

// Reward records for each referral level
export const referralRewards = mysqlTable("referralRewards", {
  id: int("id").autoincrement().primaryKey(),
  beneficiaryUserId: int("beneficiaryUserId").notNull(), // who earns the reward
  referredUserId: int("referredUserId").notNull(), // whose purchase triggered it
  orderId: int("orderId").notNull(),
  level: int("level").notNull(), // 1, 2, or 3
  orderAmountUsdd: decimal("orderAmountUsdd", { precision: 18, scale: 6 }).notNull(),
  rewardRate: decimal("rewardRate", { precision: 5, scale: 4 }).notNull(), // 0.05, 0.02, 0.01
  rewardAmountUsdd: decimal("rewardAmountUsdd", { precision: 18, scale: 6 }).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "paid", "cancelled"])
    .default("pending")
    .notNull(),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ReferralReward = typeof referralRewards.$inferSelect;

// User credit wallet (earned from referrals, redeemable for goods/cashout)
export const userCredits = mysqlTable("userCredits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  balanceUsdd: decimal("balanceUsdd", { precision: 18, scale: 6 }).default("0").notNull(),
  totalEarnedUsdd: decimal("totalEarnedUsdd", { precision: 18, scale: 6 }).default("0").notNull(),
  totalSpentUsdd: decimal("totalSpentUsdd", { precision: 18, scale: 6 }).default("0").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserCredit = typeof userCredits.$inferSelect;

// ─── Supply Chain Catalog ─────────────────────────────────────────────────────
// Products listed by supply chain stores available for influencers to dropship
export const supplyChainProducts = mysqlTable("supplyChainProducts", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(), // must be a supply_chain store
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  categoryId: int("categoryId"),
  basePriceUsdd: decimal("basePriceUsdd", { precision: 18, scale: 6 }).notNull(), // wholesale price
  suggestedRetailPriceUsdd: decimal("suggestedRetailPriceUsdd", { precision: 18, scale: 6 }), // MSRP
  images: json("images").$type<string[]>(),
  stock: int("stock").default(0).notNull(),
  minOrderQty: int("minOrderQty").default(1).notNull(),
  weight: decimal("weight", { precision: 10, scale: 3 }),
  tags: json("tags").$type<string[]>(),
  isDropshipAvailable: int("isDropshipAvailable").default(1).notNull(),
  isActive: int("isActive").default(1).notNull(),
  salesCount: int("salesCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SupplyChainProduct = typeof supplyChainProducts.$inferSelect;

// Links influencer store products to supply chain source products (dropship)
export const dropshipLinks = mysqlTable("dropshipLinks", {
  id: int("id").autoincrement().primaryKey(),
  influencerStoreId: int("influencerStoreId").notNull(),
  influencerProductId: int("influencerProductId").notNull(), // storeProducts.id
  supplyChainProductId: int("supplyChainProductId").notNull(),
  supplyChainStoreId: int("supplyChainStoreId").notNull(),
  markupPriceUsdd: decimal("markupPriceUsdd", { precision: 18, scale: 6 }).notNull(), // influencer's selling price
  basePriceUsdd: decimal("basePriceUsdd", { precision: 18, scale: 6 }).notNull(), // supply chain cost
  influencerMarginUsdd: decimal("influencerMarginUsdd", { precision: 18, scale: 6 }).notNull(), // markup - base
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DropshipLink = typeof dropshipLinks.$inferSelect;

// Dropship fulfillment orders (sent to supply chain when influencer makes a sale)
export const dropshipOrders = mysqlTable("dropshipOrders", {
  id: int("id").autoincrement().primaryKey(),
  storeOrderId: int("storeOrderId").notNull(), // original storeOrders.id
  influencerStoreId: int("influencerStoreId").notNull(),
  supplyChainStoreId: int("supplyChainStoreId").notNull(),
  supplyChainProductId: int("supplyChainProductId").notNull(),
  quantity: int("quantity").notNull(),
  basePriceUsdd: decimal("basePriceUsdd", { precision: 18, scale: 6 }).notNull(),
  totalCostUsdd: decimal("totalCostUsdd", { precision: 18, scale: 6 }).notNull(),
  // Shipping address (copied from buyer's order)
  shippingName: varchar("shippingName", { length: 128 }),
  shippingPhone: varchar("shippingPhone", { length: 32 }),
  shippingAddress: text("shippingAddress"),
  shippingCountry: varchar("shippingCountry", { length: 64 }),
  status: mysqlEnum("status", ["pending", "accepted", "shipped", "delivered", "cancelled"])
    .default("pending")
    .notNull(),
  trackingNumber: varchar("trackingNumber", { length: 128 }),
  supplyChainNote: text("supplyChainNote"),
  shippedAt: timestamp("shippedAt"),
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DropshipOrder = typeof dropshipOrders.$inferSelect;

// ─── USDD Wallet System ───────────────────────────────────────────────────────
// Each user has a USDD wallet for paying orders and receiving referral rewards

export const usddWallets = mysqlTable("usddWallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  balanceUsdd: decimal("balanceUsdd", { precision: 18, scale: 6 }).default("0").notNull(),
  totalDepositedUsdd: decimal("totalDepositedUsdd", { precision: 18, scale: 6 }).default("0").notNull(),
  totalSpentUsdd: decimal("totalSpentUsdd", { precision: 18, scale: 6 }).default("0").notNull(),
  // TRC-20 deposit address assigned to this user (for monitoring incoming transfers)
  depositAddress: varchar("depositAddress", { length: 64 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type UsddWallet = typeof usddWallets.$inferSelect;

// Transaction log for all USDD movements (deposits, payments, rewards, withdrawals)
export const usddTransactions = mysqlTable("usddTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", [
    "deposit",       // user topped up via TRC-20
    "payment",       // user paid for an order
    "refund",        // order refund
    "reward",        // referral reward credited
    "withdrawal",    // seller withdrew to external wallet
    "adjustment",    // admin manual adjustment
  ]).notNull(),
  amountUsdd: decimal("amountUsdd", { precision: 18, scale: 6 }).notNull(), // positive = credit, negative = debit
  balanceAfterUsdd: decimal("balanceAfterUsdd", { precision: 18, scale: 6 }).notNull(),
  // Reference IDs (nullable, depends on type)
  orderId: int("orderId"),
  depositScreenshotUrl: text("depositScreenshotUrl"),
  txHash: varchar("txHash", { length: 128 }), // TRC-20 transaction hash
  status: mysqlEnum("status", ["pending", "confirmed", "rejected", "completed"])
    .default("pending")
    .notNull(),
  note: text("note"),
  adminNote: text("adminNote"),
  confirmedAt: timestamp("confirmedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UsddTransaction = typeof usddTransactions.$inferSelect;

// ─── Seller Withdrawal Requests ───────────────────────────────────────────────
// Sellers request to withdraw their earnings to an external TRC-20 wallet

export const withdrawalRequests = mysqlTable("withdrawalRequests", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  userId: int("userId").notNull(),
  amountUsdd: decimal("amountUsdd", { precision: 18, scale: 6 }).notNull(),
  walletAddress: varchar("walletAddress", { length: 64 }).notNull(), // TRC-20 destination
  status: mysqlEnum("status", ["pending", "approved", "rejected", "paid"])
    .default("pending")
    .notNull(),
  // Admin fills these in when processing
  txHash: varchar("txHash", { length: 128 }),
  adminNote: text("adminNote"),
  rejectionReason: text("rejectionReason"),
  approvedAt: timestamp("approvedAt"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
