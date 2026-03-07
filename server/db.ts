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
