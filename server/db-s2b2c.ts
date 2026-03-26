import { eq, and, desc, sql, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
let _db: ReturnType<typeof drizzle> | null = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    _db = drizzle(postgres(process.env.DATABASE_URL!, { max: 10 }));
  }
  return _db!;
}
import {
  storeProfiles, referralCodes, referralRelations, referralRewards,
  userCredits, supplyChainProducts, dropshipLinks, dropshipOrders,
  stores, users,
} from "../drizzle/schema.ts";

// ─── Referral Code ────────────────────────────────────────────────────────────

function generateCode(userId: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  // Use userId as seed for deterministic prefix
  const seed = userId.toString(36).toUpperCase().padStart(3, "0").slice(-3);
  code += seed;
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function getOrCreateReferralCode(userId: number) {
  const db = await getDb();
  const existing = await db.select().from(referralCodes).where(eq(referralCodes.userId, userId)).limit(1);
  if (existing.length > 0) return existing[0];
  const code = generateCode(userId);
  const [inserted] = await db.insert(referralCodes).values({ userId, code });
  return db.select().from(referralCodes).where(eq(referralCodes.userId, userId)).limit(1).then(r => r[0]);
}

export async function getReferralCodeByCode(code: string) {
  const db = await getDb();
  const rows = await db.select().from(referralCodes).where(eq(referralCodes.code, code.toUpperCase())).limit(1);
  return rows[0] ?? null;
}

// ─── Referral Relation ────────────────────────────────────────────────────────

export async function applyReferralCode(newUserId: number, code: string) {
  const db = await getDb();
  // Check if already has a referral relation
  const existing = await db.select().from(referralRelations).where(eq(referralRelations.userId, newUserId)).limit(1);
  if (existing.length > 0) return null; // already referred

  const refCode = await getReferralCodeByCode(code);
  if (!refCode) return null;
  if (refCode.userId === newUserId) return null; // can't refer yourself

  const l1UserId = refCode.userId;

  // Find L2 (L1's referrer)
  const l1Relation = await db.select().from(referralRelations).where(eq(referralRelations.userId, l1UserId)).limit(1);
  const l2UserId = l1Relation[0]?.referredByUserId ?? null;

  // Find L3 (L2's referrer)
  let l3UserId: number | null = null;
  if (l2UserId) {
    const l2Relation = await db.select().from(referralRelations).where(eq(referralRelations.userId, l2UserId)).limit(1);
    l3UserId = l2Relation[0]?.referredByUserId ?? null;
  }

  await db.insert(referralRelations).values({
    userId: newUserId,
    referredByUserId: l1UserId,
    l2UserId,
    l3UserId,
    referralCode: code.toUpperCase(),
  });

  // Increment referral count for L1
  await db.update(referralCodes)
    .set({ totalReferrals: sql`${referralCodes.totalReferrals} + 1` })
    .where(eq(referralCodes.userId, l1UserId));

  return { l1UserId, l2UserId, l3UserId };
}

export async function getReferralRelation(userId: number) {
  const db = await getDb();
  const rows = await db.select().from(referralRelations).where(eq(referralRelations.userId, userId)).limit(1);
  return rows[0] ?? null;
}

// ─── Referral Rewards (triggered on first purchase) ──────────────────────────

// Reward rates per level
const REWARD_RATES: Record<number, number> = { 1: 0.05, 2: 0.02, 3: 0.01 };

export async function triggerReferralRewards(buyerUserId: number, orderId: number, orderAmountUsdd: number) {
  const db = await getDb();
  const relation = await getReferralRelation(buyerUserId);
  if (!relation || relation.firstPurchaseDone) return [];

  // Mark first purchase done
  await db.update(referralRelations)
    .set({ firstPurchaseDone: 1, firstPurchaseAt: new Date() })
    .where(eq(referralRelations.userId, buyerUserId));

  const rewards: { level: number; beneficiaryUserId: number; rewardAmountUsdd: number }[] = [];
  const beneficiaries = [
    { level: 1, userId: relation.referredByUserId },
    { level: 2, userId: relation.l2UserId },
    { level: 3, userId: relation.l3UserId },
  ].filter(b => b.userId != null) as { level: number; userId: number }[];

  for (const b of beneficiaries) {
    const rate = REWARD_RATES[b.level];
    const rewardAmount = parseFloat((orderAmountUsdd * rate).toFixed(6));
    await db.insert(referralRewards).values({
      beneficiaryUserId: b.userId,
      referredUserId: buyerUserId,
      orderId,
      level: b.level,
      orderAmountUsdd: orderAmountUsdd.toString(),
      rewardRate: rate.toString(),
      rewardAmountUsdd: rewardAmount.toString(),
      status: "pending",
    });
    rewards.push({ level: b.level, beneficiaryUserId: b.userId, rewardAmountUsdd: rewardAmount });
  }
  return rewards;
}

export async function getUserRewards(userId: number, opts: { page?: number; limit?: number } = {}) {
  const db = await getDb();
  const { page = 1, limit = 20 } = opts;
  const offset = (page - 1) * limit;
  return db.select().from(referralRewards)
    .where(eq(referralRewards.beneficiaryUserId, userId))
    .orderBy(desc(referralRewards.createdAt))
    .limit(limit).offset(offset);
}

export async function confirmReferralReward(rewardId: number) {
  const db = await getDb();
  const rows = await db.select().from(referralRewards).where(eq(referralRewards.id, rewardId)).limit(1);
  if (!rows[0] || rows[0].status !== "pending") throw new Error("Reward not found or not pending");
  const reward = rows[0];

  // Credit the user
  await db.insert(userCredits).values({
    userId: reward.beneficiaryUserId,
    balanceUsdd: reward.rewardAmountUsdd,
    totalEarnedUsdd: reward.rewardAmountUsdd,
    totalSpentUsdd: "0",
  }).onConflictDoUpdate({
    target: userCredits.userId,
    set: {
      balanceUsdd: sql`${userCredits.balanceUsdd} + ${reward.rewardAmountUsdd}`,
      totalEarnedUsdd: sql`${userCredits.totalEarnedUsdd} + ${reward.rewardAmountUsdd}`,
    },
  });

  // Update reward status
  await db.update(referralRewards)
    .set({ status: "confirmed" })
    .where(eq(referralRewards.id, rewardId));

  // Update referral code stats
  await db.update(referralCodes)
    .set({ totalRewardsUsdd: sql`${referralCodes.totalRewardsUsdd} + ${reward.rewardAmountUsdd}` })
    .where(eq(referralCodes.userId, reward.beneficiaryUserId));
}

export async function listPendingRewards(opts: { page?: number; limit?: number } = {}) {
  const db = await getDb();
  const { page = 1, limit = 50 } = opts;
  const offset = (page - 1) * limit;
  return db.select({
    reward: referralRewards,
    beneficiary: { id: users.id, name: users.name, email: users.email },
  })
    .from(referralRewards)
    .leftJoin(users, eq(referralRewards.beneficiaryUserId, users.id))
    .where(eq(referralRewards.status, "pending"))
    .orderBy(desc(referralRewards.createdAt))
    .limit(limit).offset(offset);
}

// ─── User Credits ─────────────────────────────────────────────────────────────

export async function getUserCredits(userId: number) {
  const db = await getDb();
  const rows = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1);
  return rows[0] ?? { userId, balanceUsdd: "0", totalEarnedUsdd: "0", totalSpentUsdd: "0" };
}

// ─── Store Profile ────────────────────────────────────────────────────────────

export async function getOrCreateStoreProfile(storeId: number, storeType: "influencer" | "supply_chain" | "brand" = "influencer") {
  const db = await getDb();
  const existing = await db.select().from(storeProfiles).where(eq(storeProfiles.storeId, storeId)).limit(1);
  if (existing.length > 0) return existing[0];
  await db.insert(storeProfiles).values({ storeId, storeType });
  return db.select().from(storeProfiles).where(eq(storeProfiles.storeId, storeId)).limit(1).then(r => r[0]);
}

export async function updateStoreProfile(storeId: number, data: Partial<typeof storeProfiles.$inferInsert>) {
  const db = await getDb();
  await db.update(storeProfiles).set(data).where(eq(storeProfiles.storeId, storeId));
}

// ─── Supply Chain Products ────────────────────────────────────────────────────

export async function listSupplyChainProducts(opts: { search?: string; categoryId?: number; page?: number; limit?: number } = {}) {
  const db = await getDb();
  const { page = 1, limit = 20 } = opts;
  const offset = (page - 1) * limit;
  const conditions = [eq(supplyChainProducts.isActive, 1), eq(supplyChainProducts.isDropshipAvailable, 1)];
  if (opts.categoryId) conditions.push(eq(supplyChainProducts.categoryId, opts.categoryId));
  const rows = await db.select({
    product: supplyChainProducts,
    store: { id: stores.id, name: stores.name, slug: stores.slug },
  })
    .from(supplyChainProducts)
    .leftJoin(stores, eq(supplyChainProducts.storeId, stores.id))
    .where(and(...conditions))
    .orderBy(desc(supplyChainProducts.salesCount))
    .limit(limit).offset(offset);
  const [{ count }] = await db.select({ count: sql<number>`count(*)` })
    .from(supplyChainProducts).where(and(...conditions));
  return { products: rows, total: count, page, limit };
}

export async function getSupplyChainProduct(id: number) {
  const db = await getDb();
  const rows = await db.select().from(supplyChainProducts).where(eq(supplyChainProducts.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createSupplyChainProduct(data: typeof supplyChainProducts.$inferInsert) {
  const db = await getDb();
  await db.insert(supplyChainProducts).values(data);
  const rows = await db.select().from(supplyChainProducts)
    .where(and(eq(supplyChainProducts.storeId, data.storeId), eq(supplyChainProducts.name, data.name)))
    .orderBy(desc(supplyChainProducts.createdAt)).limit(1);
  return rows[0];
}

export async function getStoreSupplyChainProducts(storeId: number, opts: { page?: number; limit?: number } = {}) {
  const db = await getDb();
  const { page = 1, limit = 20 } = opts;
  const offset = (page - 1) * limit;
  return db.select().from(supplyChainProducts)
    .where(eq(supplyChainProducts.storeId, storeId))
    .orderBy(desc(supplyChainProducts.createdAt))
    .limit(limit).offset(offset);
}

// ─── Dropship Links ───────────────────────────────────────────────────────────

export async function createDropshipLink(data: typeof dropshipLinks.$inferInsert) {
  const db = await getDb();
  await db.insert(dropshipLinks).values(data);
}

export async function getDropshipLinkByProduct(influencerProductId: number) {
  const db = await getDb();
  const rows = await db.select().from(dropshipLinks)
    .where(and(eq(dropshipLinks.influencerProductId, influencerProductId), eq(dropshipLinks.isActive, 1)))
    .limit(1);
  return rows[0] ?? null;
}

// ─── Dropship Orders ──────────────────────────────────────────────────────────

export async function createDropshipOrder(data: typeof dropshipOrders.$inferInsert) {
  const db = await getDb();
  await db.insert(dropshipOrders).values(data);
}

export async function getSupplyChainPendingOrders(supplyChainStoreId: number, opts: { page?: number; limit?: number } = {}) {
  const db = await getDb();
  const { page = 1, limit = 20 } = opts;
  const offset = (page - 1) * limit;
  return db.select().from(dropshipOrders)
    .where(and(eq(dropshipOrders.supplyChainStoreId, supplyChainStoreId), eq(dropshipOrders.status, "pending")))
    .orderBy(desc(dropshipOrders.createdAt))
    .limit(limit).offset(offset);
}

export async function updateDropshipOrderStatus(id: number, status: "accepted" | "shipped" | "delivered" | "cancelled", trackingNumber?: string) {
  const db = await getDb();
  const updates: any = { status };
  if (trackingNumber) updates.trackingNumber = trackingNumber;
  if (status === "shipped") updates.shippedAt = new Date();
  if (status === "delivered") updates.deliveredAt = new Date();
  await db.update(dropshipOrders).set(updates).where(eq(dropshipOrders.id, id));
}

export async function getInfluencerDropshipOrders(influencerStoreId: number, opts: { page?: number; limit?: number } = {}) {
  const db = await getDb();
  const { page = 1, limit = 20 } = opts;
  const offset = (page - 1) * limit;
  return db.select().from(dropshipOrders)
    .where(eq(dropshipOrders.influencerStoreId, influencerStoreId))
    .orderBy(desc(dropshipOrders.createdAt))
    .limit(limit).offset(offset);
}

// ─── Referral Tree for Dashboard ─────────────────────────────────────────────

export async function getReferralTree(userId: number) {
  const db = await getDb();
  // Get direct referrals (L1)
  const l1 = await db.select({
    relation: referralRelations,
    user: { id: users.id, name: users.name, email: users.email },
  })
    .from(referralRelations)
    .leftJoin(users, eq(referralRelations.userId, users.id))
    .where(eq(referralRelations.referredByUserId, userId));

  // Get L2 (referred by L1s)
  const l1Ids = l1.map(r => r.relation.userId);
  const l2 = l1Ids.length > 0
    ? await db.select({
        relation: referralRelations,
        user: { id: users.id, name: users.name, email: users.email },
      })
        .from(referralRelations)
        .leftJoin(users, eq(referralRelations.userId, users.id))
        .where(sql`${referralRelations.referredByUserId} IN (${sql.join(l1Ids.map(id => sql`${id}`), sql`, `)})`)
    : [];

  // Get L3 (referred by L2s)
  const l2Ids = l2.map(r => r.relation.userId);
  const l3 = l2Ids.length > 0
    ? await db.select({
        relation: referralRelations,
        user: { id: users.id, name: users.name, email: users.email },
      })
        .from(referralRelations)
        .leftJoin(users, eq(referralRelations.userId, users.id))
        .where(sql`${referralRelations.referredByUserId} IN (${sql.join(l2Ids.map(id => sql`${id}`), sql`, `)})`)
    : [];

  return { l1, l2, l3 };
}
