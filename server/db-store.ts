import { drizzle } from "drizzle-orm/mysql2";
import {
  stores,
  storeProducts,
  storeDeposits,
  platformConfig,
  commissionRecords,
  storeOrders,
  type Store,
  type InsertStore,
  type StoreProduct,
  type InsertStoreProduct,
  type StoreDeposit,
  type InsertStoreDeposit,
  type CommissionRecord,
} from "../drizzle/schema";
import { eq, and, desc, like, sql } from "drizzle-orm";

let _db: ReturnType<typeof drizzle> | null = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    _db = drizzle(process.env.DATABASE_URL);
  }
  return _db!;
}

// ─── Platform Config ──────────────────────────────────────────────────────────

export async function getPlatformConfig(key: string): Promise<string | null> {
  const [row] = await (await getDb()).select().from(platformConfig).where(eq(platformConfig.key, key)).limit(1);
  return row?.value ?? null;
}

export async function setPlatformConfig(key: string, value: string, description?: string) {
  await (await getDb())
    .insert(platformConfig)
    .values({ key, value, description })
    .onDuplicateKeyUpdate({ set: { value, ...(description ? { description } : {}) } });
}

export async function getAllPlatformConfig() {
  return (await getDb()).select().from(platformConfig);
}

export async function getDefaultCommissionRate(): Promise<number> {
  const val = await getPlatformConfig("commission_rate");
  return val ? parseFloat(val) : 0.05;
}

export async function getDepositAmount(): Promise<number> {
  const val = await getPlatformConfig("deposit_amount");
  return val ? parseFloat(val) : 50;
}

export async function isDepositRequired(): Promise<boolean> {
  const val = await getPlatformConfig("deposit_required");
  return val !== "0";
}

// ─── Stores ───────────────────────────────────────────────────────────────────

export async function getStoreByUserId(userId: number): Promise<Store | null> {
  const [store] = await (await getDb()).select().from(stores).where(eq(stores.userId, userId)).limit(1);
  return store ?? null;
}

export async function getStoreById(id: number): Promise<Store | null> {
  const [store] = await (await getDb()).select().from(stores).where(eq(stores.id, id)).limit(1);
  return store ?? null;
}

export async function getStoreBySlug(slug: string): Promise<Store | null> {
  const [store] = await (await getDb()).select().from(stores).where(eq(stores.slug, slug)).limit(1);
  return store ?? null;
}

export async function createStore(data: InsertStore): Promise<Store> {
  const [result] = await (await getDb()).insert(stores).values(data);
  const store = await getStoreById((result as any).insertId);
  return store!;
}

export async function updateStore(id: number, data: Partial<InsertStore>): Promise<void> {
  await (await getDb()).update(stores).set(data).where(eq(stores.id, id));
}

export async function listActiveStores(opts: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { search, page = 1, limit = 20 } = opts;
  const offset = (page - 1) * limit;

  const conditions = [eq(stores.status, "active")];
  if (search) {
    conditions.push(like(stores.name, `%${search}%`));
  }

  const [rows, [{ count }]] = await Promise.all([
    (await getDb())
      .select()
      .from(stores)
      .where(and(...conditions))
      .orderBy(desc(stores.createdAt))
      .limit(limit)
      .offset(offset),
    (await getDb())
      .select({ count: sql<number>`count(*)` })
      .from(stores)
      .where(and(...conditions)),
  ]);

  return { stores: rows, total: Number(count), page, limit };
}

export async function listAllStoresAdmin(opts: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { status, page = 1, limit = 20 } = opts;
  const offset = (page - 1) * limit;

  const conditions = status
    ? [eq(stores.status, status as any)]
    : [];

  const [rows, [{ count }]] = await Promise.all([
    (await getDb())
      .select()
      .from(stores)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(stores.createdAt))
      .limit(limit)
      .offset(offset),
    (await getDb())
      .select({ count: sql<number>`count(*)` })
      .from(stores)
      .where(conditions.length ? and(...conditions) : undefined),
  ]);

  return { stores: rows, total: Number(count), page, limit };
}

export async function approveStore(id: number, adminNote?: string): Promise<void> {
  await (await getDb()).update(stores).set({
    status: "active",
    approvedAt: new Date(),
    adminNote: adminNote ?? null,
  }).where(eq(stores.id, id));
}

export async function rejectStore(id: number, adminNote: string): Promise<void> {
  await (await getDb()).update(stores).set({
    status: "rejected",
    adminNote,
  }).where(eq(stores.id, id));
}

export async function suspendStore(id: number, adminNote: string): Promise<void> {
  await (await getDb()).update(stores).set({
    status: "suspended",
    adminNote,
  }).where(eq(stores.id, id));
}

export async function reinstateStore(id: number): Promise<void> {
  await (await getDb()).update(stores).set({ status: "active", adminNote: null }).where(eq(stores.id, id));
}

// ─── Store Products ───────────────────────────────────────────────────────────

export async function getStoreProducts(opts: {
  storeId?: number;
  search?: string;
  page?: number;
  limit?: number;
  activeOnly?: boolean;
}) {
  const { storeId, search, page = 1, limit = 20, activeOnly = true } = opts;
  const offset = (page - 1) * limit;

  const conditions: any[] = [];
  if (storeId) conditions.push(eq(storeProducts.storeId, storeId));
  if (activeOnly) conditions.push(eq(storeProducts.isActive, 1));
  if (search) conditions.push(like(storeProducts.name, `%${search}%`));

  const [rows, [{ count }]] = await Promise.all([
    (await getDb())
      .select()
      .from(storeProducts)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(storeProducts.createdAt))
      .limit(limit)
      .offset(offset),
    (await getDb())
      .select({ count: sql<number>`count(*)` })
      .from(storeProducts)
      .where(conditions.length ? and(...conditions) : undefined),
  ]);

  return { products: rows, total: Number(count), page, limit };
}

export async function getStoreProductBySlug(slug: string): Promise<StoreProduct | null> {
  const [product] = await (await getDb()).select().from(storeProducts).where(eq(storeProducts.slug, slug)).limit(1);
  return product ?? null;
}

export async function getStoreProductById(id: number): Promise<StoreProduct | null> {
  const [product] = await (await getDb()).select().from(storeProducts).where(eq(storeProducts.id, id)).limit(1);
  return product ?? null;
}

export async function createStoreProduct(data: InsertStoreProduct): Promise<StoreProduct> {
  const [result] = await (await getDb()).insert(storeProducts).values(data);
  const product = await getStoreProductById((result as any).insertId);
  return product!;
}

export async function updateStoreProduct(id: number, data: Partial<InsertStoreProduct>): Promise<void> {
  await (await getDb()).update(storeProducts).set(data).where(eq(storeProducts.id, id));
}

export async function deleteStoreProduct(id: number): Promise<void> {
  await (await getDb()).update(storeProducts).set({ isActive: 0 }).where(eq(storeProducts.id, id));
}

// Get all store products across all stores (marketplace)
export async function getMarketplaceProducts(opts: {
  search?: string;
  categoryId?: number;
  platform?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "newest" | "popular" | "price_asc" | "price_desc";
  page?: number;
  limit?: number;
}) {
  const { search, categoryId, platform, minPrice, maxPrice, sortBy = "popular", page = 1, limit = 20 } = opts;
  const offset = (page - 1) * limit;

  const conditions: any[] = [eq(storeProducts.isActive, 1)];
  if (search) conditions.push(like(storeProducts.name, `%${search}%`));
  if (categoryId) conditions.push(eq(storeProducts.categoryId, categoryId));
  if (platform) conditions.push(eq(storeProducts.externalPlatform, platform as any));
  if (minPrice !== undefined) conditions.push(sql`CAST(${storeProducts.priceUsdd} AS DECIMAL(18,6)) >= ${minPrice}`);
  if (maxPrice !== undefined) conditions.push(sql`CAST(${storeProducts.priceUsdd} AS DECIMAL(18,6)) <= ${maxPrice}`);

  const orderByClause =
    sortBy === "newest" ? [desc(storeProducts.createdAt)] :
    sortBy === "price_asc" ? [sql`CAST(${storeProducts.priceUsdd} AS DECIMAL(18,6)) ASC`] :
    sortBy === "price_desc" ? [sql`CAST(${storeProducts.priceUsdd} AS DECIMAL(18,6)) DESC`] :
    [desc(storeProducts.salesCount), desc(storeProducts.createdAt)];

  const [rows, [{ count }]] = await Promise.all([
    (await getDb())
      .select({
        product: storeProducts,
        store: {
          id: stores.id,
          name: stores.name,
          slug: stores.slug,
          logoUrl: stores.logoUrl,
        },
      })
      .from(storeProducts)
      .innerJoin(stores, and(eq(storeProducts.storeId, stores.id), eq(stores.status, "active")))
      .where(and(...conditions))
      .orderBy(...orderByClause)
      .limit(limit)
      .offset(offset),
    (await getDb())
      .select({ count: sql<number>`count(*)` })
      .from(storeProducts)
      .innerJoin(stores, and(eq(storeProducts.storeId, stores.id), eq(stores.status, "active")))
      .where(and(...conditions)),
  ]);

  return { products: rows, total: Number(count), page, limit };
}

// ─── Store Deposits ───────────────────────────────────────────────────────────

export async function createStoreDeposit(data: InsertStoreDeposit): Promise<StoreDeposit> {
  const [result] = await (await getDb()).insert(storeDeposits).values(data);
  const [deposit] = await (await getDb()).select().from(storeDeposits).where(eq(storeDeposits.id, (result as any).insertId));
  return deposit!;
}

export async function getDepositByStoreId(storeId: number): Promise<StoreDeposit | null> {
  const [deposit] = await (await getDb())
    .select()
    .from(storeDeposits)
    .where(eq(storeDeposits.storeId, storeId))
    .orderBy(desc(storeDeposits.createdAt))
    .limit(1);
  return deposit ?? null;
}

export async function confirmDeposit(id: number): Promise<void> {
  await (await getDb()).update(storeDeposits).set({
    status: "confirmed",
    confirmedAt: new Date(),
  }).where(eq(storeDeposits.id, id));
}

export async function refundDeposit(id: number, adminNote?: string): Promise<void> {
  await (await getDb()).update(storeDeposits).set({
    status: "refunded",
    refundedAt: new Date(),
    adminNote: adminNote ?? null,
  }).where(eq(storeDeposits.id, id));
}

export async function listDepositsAdmin(opts: { status?: string; page?: number; limit?: number }) {
  const { status, page = 1, limit = 20 } = opts;
  const offset = (page - 1) * limit;
  const conditions = status ? [eq(storeDeposits.status, status as any)] : [];

  const rows = await (await getDb())
    .select({
      deposit: storeDeposits,
      store: { id: stores.id, name: stores.name, slug: stores.slug },
    })
    .from(storeDeposits)
    .leftJoin(stores, eq(storeDeposits.storeId, stores.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(storeDeposits.createdAt))
    .limit(limit)
    .offset(offset);

  return rows;
}

// ─── Commission Records ───────────────────────────────────────────────────────

export async function getStoreCommissions(storeId: number, opts: { page?: number; limit?: number }) {
  const { page = 1, limit = 20 } = opts;
  const offset = (page - 1) * limit;

  const [rows, [{ count }]] = await Promise.all([
    (await getDb())
      .select()
      .from(commissionRecords)
      .where(eq(commissionRecords.storeId, storeId))
      .orderBy(desc(commissionRecords.createdAt))
      .limit(limit)
      .offset(offset),
    (await getDb())
      .select({ count: sql<number>`count(*)` })
      .from(commissionRecords)
      .where(eq(commissionRecords.storeId, storeId)),
  ]);

  return { records: rows, total: Number(count) };
}

export async function getStoreStats(storeId: number) {
  const [productCount] = await (await getDb())
    .select({ count: sql<number>`count(*)` })
    .from(storeProducts)
    .where(and(eq(storeProducts.storeId, storeId), eq(storeProducts.isActive, 1)));

  const [orderCount] = await (await getDb())
    .select({ count: sql<number>`count(*)` })
    .from(storeOrders)
    .where(eq(storeOrders.storeId, storeId));

  const [earningsRow] = await (await getDb())
    .select({ total: sql<string>`COALESCE(SUM(sellerEarningsUsdd), 0)` })
    .from(commissionRecords)
    .where(eq(commissionRecords.storeId, storeId));

  const [commissionRow] = await (await getDb())
    .select({ total: sql<string>`COALESCE(SUM(commissionAmountUsdd), 0)` })
    .from(commissionRecords)
    .where(eq(commissionRecords.storeId, storeId));

  return {
    productCount: Number(productCount?.count ?? 0),
    orderCount: Number(orderCount?.count ?? 0),
    totalEarnings: parseFloat(earningsRow?.total ?? "0"),
    totalCommission: parseFloat(commissionRow?.total ?? "0"),
  };
}

// ─── Admin Stats ──────────────────────────────────────────────────────────────

export async function getMarketplaceAdminStats() {
  const [storeCount] = await (await getDb()).select({ count: sql<number>`count(*)` }).from(stores);
  const [pendingStores] = await (await getDb())
    .select({ count: sql<number>`count(*)` })
    .from(stores)
    .where(eq(stores.status, "pending"));
  const [activeStores] = await (await getDb())
    .select({ count: sql<number>`count(*)` })
    .from(stores)
    .where(eq(stores.status, "active"));
  const [totalCommission] = await (await getDb())
    .select({ total: sql<string>`COALESCE(SUM(commissionAmountUsdd), 0)` })
    .from(commissionRecords);
  const [totalDeposits] = await (await getDb())
    .select({ total: sql<string>`COALESCE(SUM(amountUsdd), 0)` })
    .from(storeDeposits)
    .where(eq(storeDeposits.status, "confirmed"));

  return {
    totalStores: Number(storeCount?.count ?? 0),
    pendingStores: Number(pendingStores?.count ?? 0),
    activeStores: Number(activeStores?.count ?? 0),
    totalCommissionEarned: parseFloat(totalCommission?.total ?? "0"),
    totalDepositsHeld: parseFloat(totalDeposits?.total ?? "0"),
  };
}
