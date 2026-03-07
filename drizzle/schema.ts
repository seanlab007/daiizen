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
