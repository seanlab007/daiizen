import { and, desc, eq, ilike, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, products, categories, cartItems, orders, orderItems, addresses, exchangeRates, chatMessages } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { nanoid } from "nanoid";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(input: {
  categorySlug?: string;
  search?: string;
  sort?: "newest" | "price_asc" | "price_desc";
  page: number;
  limit: number;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  let query = db
    .select({ product: products, category: categories })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.isActive, 1))
    .$dynamic();

  const conditions = [eq(products.isActive, 1)];

  if (input.categorySlug) {
    const cat = await db.select().from(categories).where(eq(categories.slug, input.categorySlug)).limit(1);
    if (cat[0]) conditions.push(eq(products.categoryId, cat[0].id));
  }

  if (input.search) {
    conditions.push(
      or(
        like(products.nameEn, `%${input.search}%`),
        like(products.nameEs, `%${input.search}%`),
        like(products.descriptionEn, `%${input.search}%`)
      )!
    );
  }

  const offset = (input.page - 1) * input.limit;

  const rows = await db
    .select({ product: products, category: categories })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(
      input.sort === "price_asc"
        ? products.priceUsdd
        : input.sort === "price_desc"
        ? desc(products.priceUsdd)
        : desc(products.createdAt)
    )
    .limit(input.limit)
    .offset(offset);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(and(...conditions));

  return {
    items: rows.map((r) => ({ ...r.product, category: r.category })),
    total: Number(countRow?.count ?? 0),
  };
}

export async function getFeaturedProducts(limit = 8) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(products)
    .where(and(eq(products.isFeatured, 1), eq(products.isActive, 1)))
    .orderBy(desc(products.createdAt))
    .limit(limit);
}

export async function getProductBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({ product: products, category: categories })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.slug, slug))
    .limit(1);
  if (!rows[0]) return null;
  return { ...rows[0].product, category: rows[0].category };
}

export async function createProduct(input: {
  categoryId?: number;
  slug: string;
  nameEn: string;
  nameEs?: string;
  nameTr?: string;
  namePt?: string;
  nameAr?: string;
  nameRu?: string;
  descriptionEn?: string;
  priceUsdd: string;
  stock: number;
  images?: string[];
  isFeatured?: boolean;
  isActive?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(products).values({
    ...input,
    isFeatured: input.isFeatured ? 1 : 0,
    isActive: input.isActive !== false ? 1 : 0,
    images: input.images || [],
  });
  const [row] = await db.select().from(products).where(eq(products.slug, input.slug)).limit(1);
  return row;
}

export async function updateProduct(input: { id: number; [key: string]: unknown }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const { id, ...rest } = input;
  const updateData: Record<string, unknown> = { ...rest };
  if (typeof rest.isFeatured === "boolean") updateData.isFeatured = rest.isFeatured ? 1 : 0;
  if (typeof rest.isActive === "boolean") updateData.isActive = rest.isActive ? 1 : 0;
  await db.update(products).set(updateData).where(eq(products.id, id));
  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return row;
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(products).set({ isActive: 0 }).where(eq(products.id, id));
  return { success: true };
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(categories.sortOrder);
}

export async function createCategory(input: {
  slug: string;
  nameEn: string;
  nameEs?: string;
  nameTr?: string;
  namePt?: string;
  nameAr?: string;
  nameRu?: string;
  sortOrder?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(categories).values(input);
  const [row] = await db.select().from(categories).where(eq(categories.slug, input.slug)).limit(1);
  return row;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export async function getCartItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ cartItem: cartItems, product: products })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.userId, userId));
  return rows.map((r) => ({ ...r.cartItem, product: r.product }));
}

export async function getCartCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const [row] = await db
    .select({ count: sql<number>`sum(quantity)` })
    .from(cartItems)
    .where(eq(cartItems.userId, userId));
  return Number(row?.count ?? 0);
}

export async function addToCart(userId: number, productId: number, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Check if already in cart
  const existing = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)))
    .limit(1);
  if (existing[0]) {
    await db
      .update(cartItems)
      .set({ quantity: existing[0].quantity + quantity })
      .where(eq(cartItems.id, existing[0].id));
    return { ...existing[0], quantity: existing[0].quantity + quantity };
  }
  await db.insert(cartItems).values({ userId, productId, quantity });
  const [row] = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)))
    .limit(1);
  return row;
}

export async function updateCartItem(userId: number, cartItemId: number, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (quantity <= 0) {
    await db.delete(cartItems).where(and(eq(cartItems.id, cartItemId), eq(cartItems.userId, userId)));
    return { deleted: true };
  }
  await db.update(cartItems).set({ quantity }).where(and(eq(cartItems.id, cartItemId), eq(cartItems.userId, userId)));
  return { updated: true };
}

export async function removeFromCart(userId: number, cartItemId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(cartItems).where(and(eq(cartItems.id, cartItemId), eq(cartItems.userId, userId)));
  return { success: true };
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
  return { success: true };
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function createOrder(userId: number, addressId: number, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Get cart items
  const cartRows = await getCartItems(userId);
  if (cartRows.length === 0) throw new Error("Cart is empty");

  // Get address
  const [addr] = await db.select().from(addresses).where(and(eq(addresses.id, addressId), eq(addresses.userId, userId))).limit(1);
  if (!addr) throw new Error("Address not found");

  // Calculate total
  const total = cartRows.reduce((sum, item) => {
    return sum + Number(item.product.priceUsdd) * item.quantity;
  }, 0);

  const orderNumber = `DZ${Date.now().toString(36).toUpperCase()}${nanoid(4).toUpperCase()}`;

  // Create order
  await db.insert(orders).values({
    userId,
    orderNumber,
    totalUsdd: total.toFixed(6),
    shippingAddress: {
      fullName: addr.fullName,
      phone: addr.phone || undefined,
      country: addr.country,
      state: addr.state || undefined,
      city: addr.city,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || undefined,
      postalCode: addr.postalCode || undefined,
    },
    notes,
  });

  const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);

  // Create order items
  for (const item of cartRows) {
    await db.insert(orderItems).values({
      orderId: order.id,
      productId: item.productId,
      productName: item.product.nameEn,
      productImage: (item.product.images as string[])?.[0] || item.product.aiGeneratedImageUrl || null,
      quantity: item.quantity,
      unitPriceUsdd: item.product.priceUsdd,
      subtotalUsdd: (Number(item.product.priceUsdd) * item.quantity).toFixed(6),
    });
  }

  // Clear cart
  await clearCart(userId);

  return order;
}

export async function getOrders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
  return rows;
}

export async function getOrderById(id: number, userId?: number) {
  const db = await getDb();
  if (!db) return null;
  const conditions = userId ? and(eq(orders.id, id), eq(orders.userId, userId)) : eq(orders.id, id);
  const [order] = await db.select().from(orders).where(conditions).limit(1);
  if (!order) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  return { ...order, items };
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt)).limit(200);
}

export async function updateOrderStatus(
  orderId: number,
  status: "pending_payment" | "paid" | "shipped" | "completed" | "cancelled",
  txHash?: string,
  userId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const updateData: Record<string, unknown> = { status };
  if (txHash) updateData.paymentTxHash = txHash;
  if (status === "paid") updateData.paymentConfirmedAt = new Date();
  if (status === "shipped") updateData.shippedAt = new Date();
  if (status === "completed") updateData.completedAt = new Date();

  const conditions = userId ? and(eq(orders.id, orderId), eq(orders.userId, userId)) : eq(orders.id, orderId);
  await db.update(orders).set(updateData).where(conditions);
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) throw new Error("Order not found");
  return order;
}

// ─── Addresses ────────────────────────────────────────────────────────────────

export async function getAddresses(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(addresses).where(eq(addresses.userId, userId)).orderBy(desc(addresses.isDefault));
}

export async function createAddress(userId: number, input: {
  fullName: string;
  phone?: string;
  country: string;
  state?: string;
  city: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode?: string;
  isDefault?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (input.isDefault) {
    await db.update(addresses).set({ isDefault: 0 }).where(eq(addresses.userId, userId));
  }
  await db.insert(addresses).values({ ...input, userId, isDefault: input.isDefault ? 1 : 0 });
  const rows = await db.select().from(addresses).where(eq(addresses.userId, userId)).orderBy(desc(addresses.id)).limit(1);
  return rows[0];
}

export async function updateAddress(userId: number, input: {
  id: number;
  fullName: string;
  phone?: string;
  country: string;
  state?: string;
  city: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const { id, ...rest } = input;
  await db.update(addresses).set(rest).where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
  const [row] = await db.select().from(addresses).where(eq(addresses.id, id)).limit(1);
  return row;
}

export async function deleteAddress(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
  return { success: true };
}

export async function setDefaultAddress(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(addresses).set({ isDefault: 0 }).where(eq(addresses.userId, userId));
  await db.update(addresses).set({ isDefault: 1 }).where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
  return { success: true };
}

// ─── Exchange Rates ───────────────────────────────────────────────────────────

export async function getExchangeRates() {
  const db = await getDb();
  if (!db) return [];
  // Get latest rate per currency
  const rows = await db
    .select()
    .from(exchangeRates)
    .orderBy(desc(exchangeRates.fetchedAt));
  // Deduplicate by targetCurrency (keep latest)
  const seen = new Set<string>();
  return rows.filter((r) => {
    if (seen.has(r.targetCurrency)) return false;
    seen.add(r.targetCurrency);
    return true;
  });
}

export async function upsertExchangeRate(base: string, target: string, rate: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(exchangeRates).values({
    baseCurrency: base,
    targetCurrency: target,
    rate: rate.toString(),
    source: "exchangerate-api",
  });
  return { success: true };
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export async function saveChatMessage(input: {
  userId?: number;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  language?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(chatMessages).values(input);
  return { success: true };
}

export async function getChatHistory(sessionId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(chatMessages.createdAt)
    .limit(50);
}

// ─── Admin Stats ──────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { totalOrders: 0, totalRevenue: "0", totalProducts: 0, pendingOrders: 0 };

  const [orderStats] = await db
    .select({
      total: sql<number>`count(*)`,
      revenue: sql<string>`sum(totalUsdd)`,
      pending: sql<number>`sum(case when status = 'pending_payment' then 1 else 0 end)`,
    })
    .from(orders);

  const [productStats] = await db
    .select({ total: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.isActive, 1));

  return {
    totalOrders: Number(orderStats?.total ?? 0),
    totalRevenue: orderStats?.revenue ?? "0",
    totalProducts: Number(productStats?.total ?? 0),
    pendingOrders: Number(orderStats?.pending ?? 0),
  };
}

// ─── USDD Wallet ──────────────────────────────────────────────────────────────

export async function getOrCreateUsddWallet(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const { usddWallets } = await import("../drizzle/schema");
  const existing = await db.select().from(usddWallets).where(eq(usddWallets.userId, userId)).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(usddWallets).values({ userId, balanceUsdd: "0", totalDepositedUsdd: "0", totalSpentUsdd: "0" });
  const [row] = await db.select().from(usddWallets).where(eq(usddWallets.userId, userId)).limit(1);
  return row;
}

export async function getUserUsddBalance(userId: number) {
  const wallet = await getOrCreateUsddWallet(userId);
  return parseFloat(wallet.balanceUsdd);
}

export async function createUsddDeposit(userId: number, input: {
  amountUsdd: string;
  depositScreenshotUrl?: string;
  txHash?: string;
  note?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const { usddTransactions } = await import("../drizzle/schema");
  const wallet = await getOrCreateUsddWallet(userId);
  await db.insert(usddTransactions).values({
    userId,
    type: "deposit",
    amountUsdd: input.amountUsdd,
    balanceAfterUsdd: wallet.balanceUsdd, // will update after admin confirms
    depositScreenshotUrl: input.depositScreenshotUrl,
    txHash: input.txHash,
    status: "pending",
    note: input.note,
  });
  const [tx] = await db.select().from(usddTransactions)
    .where(eq(usddTransactions.userId, userId))
    .orderBy(desc(usddTransactions.createdAt))
    .limit(1);
  return tx;
}

export async function confirmUsddDeposit(txId: number, adminNote?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const { usddTransactions, usddWallets } = await import("../drizzle/schema");
  const [tx] = await db.select().from(usddTransactions).where(eq(usddTransactions.id, txId)).limit(1);
  if (!tx || tx.status !== "pending" || tx.type !== "deposit") throw new Error("Invalid transaction");
  const wallet = await getOrCreateUsddWallet(tx.userId);
  const newBalance = (parseFloat(wallet.balanceUsdd) + parseFloat(tx.amountUsdd)).toFixed(6);
  await db.update(usddWallets).set({
    balanceUsdd: newBalance,
    totalDepositedUsdd: (parseFloat(wallet.totalDepositedUsdd) + parseFloat(tx.amountUsdd)).toFixed(6),
  }).where(eq(usddWallets.userId, tx.userId));
  await db.update(usddTransactions).set({
    status: "confirmed",
    balanceAfterUsdd: newBalance,
    adminNote,
    confirmedAt: new Date(),
  }).where(eq(usddTransactions.id, txId));
  return { success: true, newBalance };
}

export async function rejectUsddDeposit(txId: number, adminNote: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const { usddTransactions } = await import("../drizzle/schema");
  await db.update(usddTransactions).set({ status: "rejected", adminNote }).where(eq(usddTransactions.id, txId));
  return { success: true };
}

export async function getUserUsddTransactions(userId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  const { usddTransactions } = await import("../drizzle/schema");
  return db.select().from(usddTransactions)
    .where(eq(usddTransactions.userId, userId))
    .orderBy(desc(usddTransactions.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getAllPendingUsddDeposits() {
  const db = await getDb();
  if (!db) return [];
  const { usddTransactions } = await import("../drizzle/schema");
  return db.select().from(usddTransactions)
    .where(and(eq(usddTransactions.type, "deposit"), eq(usddTransactions.status, "pending")))
    .orderBy(desc(usddTransactions.createdAt));
}

// ─── Withdrawal Requests ──────────────────────────────────────────────────────

export async function createWithdrawalRequest(input: {
  storeId: number;
  userId: number;
  amountUsdd: string;
  walletAddress: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const { withdrawalRequests, stores } = await import("../drizzle/schema");
  // Check store has enough balance
  const [store] = await db.select().from(stores).where(eq(stores.id, input.storeId)).limit(1);
  if (!store) throw new Error("Store not found");
  const available = parseFloat(store.pendingBalanceUsdd);
  const requested = parseFloat(input.amountUsdd);
  if (requested > available) throw new Error(`Insufficient balance. Available: ${available.toFixed(2)} USDD`);
  if (requested < 10) throw new Error("Minimum withdrawal is 10 USDD");
  // Deduct from pending balance
  await db.update(stores).set({
    pendingBalanceUsdd: (available - requested).toFixed(6),
  }).where(eq(stores.id, input.storeId));
  await db.insert(withdrawalRequests).values(input);
  const [row] = await db.select().from(withdrawalRequests)
    .where(eq(withdrawalRequests.storeId, input.storeId))
    .orderBy(desc(withdrawalRequests.createdAt))
    .limit(1);
  return row;
}

export async function getWithdrawalsByStore(storeId: number) {
  const db = await getDb();
  if (!db) return [];
  const { withdrawalRequests } = await import("../drizzle/schema");
  return db.select().from(withdrawalRequests)
    .where(eq(withdrawalRequests.storeId, storeId))
    .orderBy(desc(withdrawalRequests.createdAt));
}

export async function getAllWithdrawalRequests(statusFilter?: string) {
  const db = await getDb();
  if (!db) return [];
  const { withdrawalRequests } = await import("../drizzle/schema");
  const conditions = statusFilter
    ? [eq(withdrawalRequests.status, statusFilter as "pending" | "approved" | "rejected" | "paid")]
    : [];
  return db.select().from(withdrawalRequests)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(withdrawalRequests.createdAt));
}

export async function approveWithdrawal(id: number, adminNote?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const { withdrawalRequests } = await import("../drizzle/schema");
  await db.update(withdrawalRequests).set({
    status: "approved",
    adminNote,
    approvedAt: new Date(),
  }).where(eq(withdrawalRequests.id, id));
  return { success: true };
}

export async function rejectWithdrawal(id: number, rejectionReason: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const { withdrawalRequests, stores } = await import("../drizzle/schema");
  const [req] = await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.id, id)).limit(1);
  if (!req || req.status !== "pending") throw new Error("Invalid withdrawal request");
  // Refund the amount back to store balance
  const [store] = await db.select().from(stores).where(eq(stores.id, req.storeId)).limit(1);
  if (store) {
    await db.update(stores).set({
      pendingBalanceUsdd: (parseFloat(store.pendingBalanceUsdd) + parseFloat(req.amountUsdd)).toFixed(6),
    }).where(eq(stores.id, req.storeId));
  }
  await db.update(withdrawalRequests).set({
    status: "rejected",
    rejectionReason,
  }).where(eq(withdrawalRequests.id, id));
  return { success: true };
}

export async function markWithdrawalPaid(id: number, txHash: string, adminNote?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const { withdrawalRequests } = await import("../drizzle/schema");
  await db.update(withdrawalRequests).set({
    status: "paid",
    txHash,
    adminNote,
    paidAt: new Date(),
  }).where(eq(withdrawalRequests.id, id));
  return { success: true };
}

// ─── USDD Balance Payment ─────────────────────────────────────────────────────

/**
 * Pay for an order using USDD wallet balance.
 * 1. Checks user has sufficient balance
 * 2. Creates order (cart → order)
 * 3. Deducts balance and records transaction
 * 4. Marks order as paid immediately
 * 5. Credits seller earnings (pendingBalanceUsdd on stores table)
 */
export async function payOrderWithBalance(userId: number, addressId: number, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const { usddWallets, usddTransactions, stores, storeOrders, orderItems: orderItemsTable, storeProducts } = await import("../drizzle/schema");

  // 1. Create the order first (cart → order, status = pending_payment)
  const order = await createOrder(userId, addressId, notes);
  const totalAmount = parseFloat(order.totalUsdd);

  // 2. Check balance
  const wallet = await getOrCreateUsddWallet(userId);
  const currentBalance = parseFloat(wallet.balanceUsdd);
  if (currentBalance < totalAmount) {
    // Roll back: cancel the order
    await db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, order.id));
    throw new Error(`Insufficient USDD balance. You have ${currentBalance.toFixed(2)} USDD but need ${totalAmount.toFixed(2)} USDD.`);
  }

  // 3. Deduct balance
  const newBalance = (currentBalance - totalAmount).toFixed(6);
  await db.update(usddWallets).set({
    balanceUsdd: newBalance,
    totalSpentUsdd: (parseFloat(wallet.totalSpentUsdd) + totalAmount).toFixed(6),
  }).where(eq(usddWallets.userId, userId));

  // 4. Record the spend transaction
  await db.insert(usddTransactions).values({
    userId,
    type: "payment",
    amountUsdd: totalAmount.toFixed(6),
    balanceAfterUsdd: newBalance,
    status: "confirmed",
    note: `Order #${order.orderNumber}`,
    confirmedAt: new Date(),
  });

  // 5. Mark order as paid immediately
  await db.update(orders).set({
    status: "paid",
    paymentMethod: "usdd_balance",
    paymentConfirmedAt: new Date(),
  }).where(eq(orders.id, order.id));

  // 6. Credit seller earnings for store products in this order
  // Get order items and find which store each product belongs to
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  const storeEarningsMap = new Map<number, number>(); // storeId → earnings

  for (const item of items) {
    // Check if this product is a store product
    const [sp] = await db.select().from(storeProducts).where(eq(storeProducts.id, item.productId)).limit(1);
    if (sp) {
      const subtotal = parseFloat(item.subtotalUsdd);
      // Get platform commission rate from store or use default 5%
      const [store] = await db.select().from(stores).where(eq(stores.id, sp.storeId)).limit(1);
      const commissionRate = store?.commissionRate ? parseFloat(store.commissionRate) : 0.05;
      const commission = subtotal * commissionRate;
      const sellerEarnings = subtotal - commission;
      storeEarningsMap.set(sp.storeId, (storeEarningsMap.get(sp.storeId) ?? 0) + sellerEarnings);
    }
  }

  // Update store earnings
  for (const entry of Array.from(storeEarningsMap.entries())) {
    const [storeId, earnings] = entry;
    const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
    if (store) {
      await db.update(stores).set({
        totalEarningsUsdd: (parseFloat(store.totalEarningsUsdd) + earnings).toFixed(6),
        pendingBalanceUsdd: (parseFloat(store.pendingBalanceUsdd) + earnings).toFixed(6),
      }).where(eq(stores.id, storeId));
    }
  }

  const [updatedOrder] = await db.select().from(orders).where(eq(orders.id, order.id)).limit(1);
  return { order: updatedOrder, newBalance: parseFloat(newBalance) };
}

/**
 * Credit seller earnings when an order is marked as completed (for non-balance payments).
 * Called when admin marks order as "completed".
 */
export async function creditSellerEarningsForOrder(orderId: number) {
  const db = await getDb();
  if (!db) return;
  const { stores, storeProducts, orderItems: orderItemsTable } = await import("../drizzle/schema");

  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));
  const storeEarningsMap = new Map<number, number>();

  for (const item of items) {
    const [sp] = await db.select().from(storeProducts).where(eq(storeProducts.id, item.productId)).limit(1);
    if (sp) {
      const subtotal = parseFloat(item.subtotalUsdd);
      const [store] = await db.select().from(stores).where(eq(stores.id, sp.storeId)).limit(1);
      const commissionRate = store?.commissionRate ? parseFloat(store.commissionRate) : 0.05;
      const sellerEarnings = subtotal * (1 - commissionRate);
      storeEarningsMap.set(sp.storeId, (storeEarningsMap.get(sp.storeId) ?? 0) + sellerEarnings);
    }
  }

  for (const entry of Array.from(storeEarningsMap.entries())) {
    const [storeId, earnings] = entry;
    const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
    if (store) {
      await db.update(stores).set({
        totalEarningsUsdd: (parseFloat(store.totalEarningsUsdd) + earnings).toFixed(6),
        pendingBalanceUsdd: (parseFloat(store.pendingBalanceUsdd) + earnings).toFixed(6),
      }).where(eq(stores.id, storeId));
    }
  }
}
