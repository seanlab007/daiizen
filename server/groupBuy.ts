/**
 * Group Buy (拼团) Backend Logic
 * Pinduoduo-style tiered group purchasing for Daiizen products
 * 11 tiers: more people = deeper discount
 */
import { randomBytes } from "crypto";
import { getDb } from "./db";
import { groupBuys, groupBuyParticipants } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

// ─── Tier Config ──────────────────────────────────────────────────────────────
export interface PriceTier {
  minPeople: number;
  discountPct: number;
  label: string;
  badge?: string;
}

export const TIER_LADDER: PriceTier[] = [
  { minPeople: 1,     discountPct: 5,  label: "1人团",   badge: "单人享折扣" },
  { minPeople: 2,     discountPct: 8,  label: "2人团" },
  { minPeople: 5,     discountPct: 10, label: "5人团",   badge: "🔥 热门" },
  { minPeople: 10,    discountPct: 12, label: "10人团" },
  { minPeople: 20,    discountPct: 15, label: "20人团",  badge: "💎 优惠" },
  { minPeople: 50,    discountPct: 20, label: "50人团" },
  { minPeople: 100,   discountPct: 25, label: "百人团",  badge: "⭐ 超值" },
  { minPeople: 500,   discountPct: 30, label: "500人团" },
  { minPeople: 1000,  discountPct: 35, label: "千人团",  badge: "🏆 超级团" },
  { minPeople: 5000,  discountPct: 40, label: "5000人团" },
  { minPeople: 10000, discountPct: 50, label: "万人团",  badge: "👑 最高折扣" },
];

export function getCurrentTier(displayCount: number): PriceTier {
  const reached = TIER_LADDER.filter(t => displayCount >= t.minPeople);
  return reached.length > 0 ? reached[reached.length - 1] : TIER_LADDER[0];
}

export function getNextTier(displayCount: number): PriceTier | null {
  const notReached = TIER_LADDER.filter(t => displayCount < t.minPeople);
  return notReached.length > 0 ? notReached[0] : null;
}

export function calcDiscountedPrice(originalPrice: number, discountPct: number): number {
  return +(originalPrice * (1 - discountPct / 100)).toFixed(4);
}

/**
 * Generate virtual shill count for social proof.
 * Deterministic from shareToken so same token always shows same count.
 */
export function getVirtualCount(shareToken: string, createdAt: Date, groupType: string): number {
  const seed = shareToken.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hoursElapsed = Math.max(0, (Date.now() - createdAt.getTime()) / 3600000);

  let base: number;
  if (groupType === "万人团") {
    base = 2000 + (seed % 800) + Math.floor(hoursElapsed * 8);
  } else if (groupType === "flash") {
    base = 50 + (seed % 30) + Math.floor(hoursElapsed * 15);
  } else {
    base = 20 + (seed % 40) + Math.floor(hoursElapsed * 3);
  }
  const jitter = (seed % 7) - 3;
  return Math.max(1, base + jitter);
}

export function getDisplayCount(realCount: number, shareToken: string, createdAt: Date, groupType: string): number {
  const virtual = getVirtualCount(shareToken, createdAt, groupType);
  return realCount + virtual;
}

export function generateShareToken(): string {
  return randomBytes(12).toString("base64url").slice(0, 16);
}

export function generateShareLinks(
  shareToken: string,
  productName: string,
  currentDiscountPct: number,
  nextDiscountPct: number | null,
  origin: string = "https://www.daiizen.com"
): Record<string, string> {
  const baseUrl = `${origin}/group-buy/${shareToken}`;
  const nextMsg = nextDiscountPct ? `，再拉人可享 ${nextDiscountPct}% 折扣！` : "，已达最高折扣！";
  const msgZh = encodeURIComponent(
    `🔥 我在 Daiizen 拼团购买 ${productName}，现在享受 ${currentDiscountPct}% 折扣${nextMsg}\n人越多越便宜！加入我的拼团 👇\n${baseUrl}`
  );
  const msgEn = encodeURIComponent(
    `🔥 I'm group-buying ${productName} on Daiizen — ${currentDiscountPct}% off!\nMore people = lower price! Join here 👇\n${baseUrl}`
  );

  return {
    direct: baseUrl,
    whatsapp: `https://wa.me/?text=${msgZh}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(baseUrl)}&text=${encodeURIComponent(`🔥 拼团购买 ${productName}，现享 ${currentDiscountPct}% 折扣！`)}`,
    twitter: `https://twitter.com/intent/tweet?text=${msgEn}`,
    wechat: baseUrl,
    copy: baseUrl,
  };
}

export async function createGroupBuy(params: {
  creatorId: number;
  productId?: number;
  productName: string;
  productSlug?: string;
  originalPrice: number;
  groupType?: "standard" | "flash" | "万人团";
  imageUrl?: string;
  quantity?: number;
}) {
  const { creatorId, productId, productName, productSlug, originalPrice, groupType = "standard", imageUrl, quantity = 1 } = params;

  const shareToken = generateShareToken();
  const expiryHours = groupType === "flash" ? 24 : groupType === "万人团" ? 720 : 72;
  const expiresAt = new Date(Date.now() + expiryHours * 3600 * 1000);
  const targetCount = groupType === "万人团" ? 10000 : groupType === "flash" ? 5 : 10;

  const tier0 = TIER_LADDER[0];
  const lockedPrice = calcDiscountedPrice(originalPrice, tier0.discountPct);

  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [result] = await db.insert(groupBuys).values({
    productId: productId ?? null,
    productName,
    productSlug: productSlug ?? null,
    originalPrice: originalPrice.toString(),
    priceTiers: TIER_LADDER,
    groupType,
    targetCount,
    currentCount: 1,
    status: "open",
    expiresAt,
    creatorId,
    shareToken,
    imageUrl: imageUrl ?? null,
  });

  const groupId = (result as any).insertId as number;

  await db.insert(groupBuyParticipants).values({
    groupBuyId: groupId,
    userId: creatorId,
    quantity,
    lockedPrice: lockedPrice.toString(),
    discountPct: tier0.discountPct.toString(),
    joinedVia: "direct",
    txStatus: "pending",
  });

  return { groupId, shareToken, expiresAt, lockedPrice, discountPct: tier0.discountPct };
}

export async function joinGroupBuy(params: {
  groupBuyId: number;
  userId: number;
  quantity?: number;
  joinedVia?: string;
  referrerId?: number;
}) {
  const { groupBuyId, userId, quantity = 1, joinedVia = "direct", referrerId } = params;

  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [group] = await db.select().from(groupBuys).where(eq(groupBuys.id, groupBuyId));
  if (!group) throw new Error("Group buy not found");
  if (group.status !== "open") throw new Error("This group buy is no longer open");
  if (new Date() > group.expiresAt) throw new Error("This group buy has expired");

  const existing = await db.select().from(groupBuyParticipants)
    .where(and(eq(groupBuyParticipants.groupBuyId, groupBuyId), eq(groupBuyParticipants.userId, userId)));
  if (existing.length > 0) throw new Error("You have already joined this group buy");

  const newRealCount = group.currentCount + 1;
  const displayCount = getDisplayCount(newRealCount, group.shareToken, group.createdAt, group.groupType);
  const currentTier = getCurrentTier(displayCount);
  const nextTier = getNextTier(displayCount);
  const originalPrice = parseFloat(group.originalPrice);
  const lockedPrice = calcDiscountedPrice(originalPrice, currentTier.discountPct);

  await db.insert(groupBuyParticipants).values({
    groupBuyId,
    userId,
    quantity,
    lockedPrice: lockedPrice.toString(),
    discountPct: currentTier.discountPct.toString(),
    joinedVia: (joinedVia as any) || "direct",
    referrerId: referrerId ?? null,
    txStatus: "pending",
  });

  await db.update(groupBuys)
    .set({ currentCount: newRealCount, updatedAt: new Date() })
    .where(eq(groupBuys.id, groupBuyId));

  const isComplete = newRealCount >= group.targetCount;
  if (isComplete) {
    await db.update(groupBuys)
      .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
      .where(eq(groupBuys.id, groupBuyId));
  }

  return { lockedPrice, discountPct: currentTier.discountPct, displayCount, currentTier, nextTier, isComplete };
}

export async function getGroupBuyByToken(shareToken: string, origin?: string) {
  const db = await getDb();
  if (!db) return null;
  const [group] = await db.select().from(groupBuys).where(eq(groupBuys.shareToken, shareToken));
  if (!group) return null;

  const displayCount = getDisplayCount(group.currentCount, group.shareToken, group.createdAt, group.groupType);
  const currentTier = getCurrentTier(displayCount);
  const nextTier = getNextTier(displayCount);
  const originalPrice = parseFloat(group.originalPrice);

  return {
    ...group,
    tiers: TIER_LADDER,
    displayCount,
    realCount: group.currentCount,
    currentTier,
    nextTier,
    currentPrice: calcDiscountedPrice(originalPrice, currentTier.discountPct),
    originalPrice,
    shareLinks: generateShareLinks(shareToken, group.productName, currentTier.discountPct, nextTier?.discountPct ?? null, origin),
    progress: Math.min(100, Math.round((displayCount / group.targetCount) * 100)),
    isExpired: new Date() > group.expiresAt,
  };
}

export async function getActiveGroupBuys() {
  const db = await getDb();
  if (!db) return [];
  const groups = await db.select().from(groupBuys).where(eq(groupBuys.status, "open"));

  return groups.map((group: typeof groupBuys.$inferSelect) => {
    const displayCount = getDisplayCount(group.currentCount, group.shareToken, group.createdAt, group.groupType);
    const currentTier = getCurrentTier(displayCount);
    const nextTier = getNextTier(displayCount);
    const originalPrice = parseFloat(group.originalPrice);

    return {
      ...group,
      tiers: TIER_LADDER,
      displayCount,
      currentTier,
      nextTier,
      currentPrice: calcDiscountedPrice(originalPrice, currentTier.discountPct),
      originalPrice,
      progress: Math.min(100, Math.round((displayCount / group.targetCount) * 100)),
      isExpired: new Date() > group.expiresAt,
    };
  });
}
