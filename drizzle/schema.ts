import {
  boolean,
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ─── Order Items ──────────────────────────────────────────────────────────────

export const orderItems = pgTable("orderItems", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  productId: integer("productId").notNull(),
  productName: varchar("productName", { length: 256 }).notNull(), // snapshot
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
