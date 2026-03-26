import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  paymentConfigs,
  storeDeposits,
  productEvents,
  stores,
  users,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    const client = postgres(process.env.DATABASE_URL, { max: 10 });
    _db = drizzle(client);
  }
  return _db!;
}

// ─── Payment Config ───────────────────────────────────────────────────────────

export async function getPaymentConfigs() {
  const db = await getDb();
  return db.select().from(paymentConfigs).where(eq(paymentConfigs.isEnabled, 1)).orderBy(paymentConfigs.method);
}

export async function getPaymentConfigByMethod(method: string) {
  const db = await getDb();
  const [row] = await db.select().from(paymentConfigs).where(eq(paymentConfigs.method, method)).limit(1);
  return row ?? null;
}

export async function upsertPaymentConfig(data: {
  method: string;
  accountName?: string;
  accountNumber?: string;
  qrCodeUrl?: string;
  isEnabled?: number;
}) {
  const db = await getDb();
  const existing = await getPaymentConfigByMethod(data.method);
  if (existing) {
    await db.update(paymentConfigs)
      .set({
        accountName: data.accountName ?? existing.accountName,
        accountNumber: data.accountNumber ?? existing.accountNumber,
        qrCodeUrl: data.qrCodeUrl ?? existing.qrCodeUrl,
        isEnabled: data.isEnabled ?? existing.isEnabled,
        updatedAt: new Date(),
      })
      .where(eq(paymentConfigs.method, data.method));
  } else {
    await db.insert(paymentConfigs).values({
      method: data.method,
      accountName: data.accountName ?? null,
      accountNumber: data.accountNumber ?? null,
      qrCodeUrl: data.qrCodeUrl ?? null,
      isEnabled: data.isEnabled ?? 1,
      updatedAt: new Date(),
    });
  }
}

// ─── Store Deposit Payment ────────────────────────────────────────────────────

export async function submitDepositPayment(
  depositId: number,
  data: {
    paymentMethod: string;
    transferScreenshotUrl?: string;
    transferNote?: string;
  }
) {
  const db = await getDb();
  await db.update(storeDeposits)
    .set({ paymentMethod: data.paymentMethod, updatedAt: new Date() })
    .where(eq(storeDeposits.id, depositId));
}

export async function adminReviewDeposit(
  depositId: number,
  action: "confirm" | "reject",
  reviewNote?: string
) {
  const db = await getDb();
  const status = action === "confirm" ? "confirmed" as const : "rejected" as const;
  await db.update(storeDeposits)
    .set({ status, adminNote: reviewNote ?? null, confirmedAt: action === "confirm" ? new Date() : null, updatedAt: new Date() })
    .where(eq(storeDeposits.id, depositId));
  if (action === "confirm") {
    const [deposit] = await db.select({ storeId: storeDeposits.storeId })
      .from(storeDeposits).where(eq(storeDeposits.id, depositId)).limit(1);
    if (deposit?.storeId) {
      await db.update(stores)
        .set({ status: "active", updatedAt: new Date() })
        .where(and(eq(stores.id, deposit.storeId), eq(stores.status, "pending")));
    }
  }
}

export async function listPendingDepositsWithPayment(page = 1, limit = 20) {
  const db = await getDb();
  const offset = (page - 1) * limit;
  const deposits = await db.select({
    id: storeDeposits.id, storeId: storeDeposits.storeId, userId: storeDeposits.userId,
    amountUsdd: storeDeposits.amountUsdd, status: storeDeposits.status,
    paymentMethod: storeDeposits.paymentMethod, paymentTxHash: storeDeposits.paymentTxHash,
    adminNote: storeDeposits.adminNote, createdAt: storeDeposits.createdAt,
    storeName: stores.name, userName: users.name, userEmail: users.email,
  })
    .from(storeDeposits)
    .leftJoin(stores, eq(storeDeposits.storeId, stores.id))
    .leftJoin(users, eq(storeDeposits.userId, users.id))
    .where(inArray(storeDeposits.status, ["pending", "rejected"]))
    .orderBy(desc(storeDeposits.createdAt))
    .limit(limit).offset(offset);
  const [{ total }] = await db.select({ total: sql<number>`count(*)` })
    .from(storeDeposits).where(inArray(storeDeposits.status, ["pending", "rejected"]));
  return { deposits, total: Number(total) };
}

// ─── Product Analytics ────────────────────────────────────────────────────────

export async function trackProductEvent(data: {
  storeProductId: number;
  eventType: "view" | "cart_add" | "order";
  userId?: number;
  amountUsdd?: string;
}) {
  const db = await getDb();
  await db.insert(productEvents).values({
    storeProductId: data.storeProductId,
    eventType: data.eventType,
    userId: data.userId ?? null,
    amountUsdd: data.amountUsdd ?? null,
    createdAt: new Date(),
  });
}

export async function getStoreAnalytics(storeId: number) {
  const db = await getDb();
  const result = await db.execute(sql`
    SELECT sp.id, sp.name, sp.slug, sp."priceUsdd",
      COALESCE(v.cnt, 0) AS views, COALESCE(c.cnt, 0) AS "cartAdds",
      COALESCE(o.cnt, 0) AS orders, COALESCE(o.gmv, 0) AS "gmvUsdd"
    FROM "storeProducts" sp
    LEFT JOIN (SELECT "storeProductId", COUNT(*) AS cnt FROM "productEvents" WHERE "eventType"='view' GROUP BY "storeProductId") v ON v."storeProductId" = sp.id
    LEFT JOIN (SELECT "storeProductId", COUNT(*) AS cnt FROM "productEvents" WHERE "eventType"='cart_add' GROUP BY "storeProductId") c ON c."storeProductId" = sp.id
    LEFT JOIN (SELECT "storeProductId", COUNT(*) AS cnt, SUM("amountUsdd") AS gmv FROM "productEvents" WHERE "eventType"='order' GROUP BY "storeProductId") o ON o."storeProductId" = sp.id
    WHERE sp."storeId" = ${storeId} AND sp."isActive" = 1 ORDER BY "gmvUsdd" DESC
  `);
  const typedProducts = result as any[];
  const totals = typedProducts.reduce(
    (acc, p) => ({ views: acc.views + Number(p.views), cartAdds: acc.cartAdds + Number(p.cartAdds), orders: acc.orders + Number(p.orders), gmvUsdd: acc.gmvUsdd + Number(p.gmvUsdd) }),
    { views: 0, cartAdds: 0, orders: 0, gmvUsdd: 0 }
  );
  return { products: typedProducts, totals };
}

export async function getPlatformAnalytics() {
  const db = await getDb();
  const eventRows = await db.execute(sql`
    SELECT "eventType", COUNT(*) AS count, COALESCE(SUM("amountUsdd"), 0) AS "totalAmount"
    FROM "productEvents" GROUP BY "eventType"
  `);
  const events: Record<string, { count: number; totalAmount: string }> = {};
  for (const row of eventRows as any[]) {
    events[row.eventType] = { count: Number(row.count), totalAmount: String(row.totalAmount) };
  }
  const storeRows = await db.execute(sql`
    SELECT COUNT(*) AS "totalStores",
      SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS "activeStores",
      SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS "pendingStores"
    FROM stores
  `);
  return { events, stores: (storeRows as any[])[0] ?? {} };
}
