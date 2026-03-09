/**
 * Group Buy (拼团) Backend Logic
 * Pinduoduo-style: join = instant order, no waiting.
 * Social proof via virtual count + real participant count.
 * 11 tiers: more people = deeper discount
 */
import { randomBytes } from "crypto";
import { nanoid } from "nanoid";
import { getDb, getOrCreateUsddWallet } from "./db";
import { groupBuys, groupBuyParticipants, orders, orderItems, products, addresses, usddWallets, usddTransactions } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { createUserNotification } from "./db";

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

  // ── Reserve spot: insert participant record (no cart, no immediate order) ─
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

  // ── Check if group is now complete → create orders for all participants ───
  const isComplete = newRealCount >= group.targetCount;
  if (isComplete) {
    await db.update(groupBuys)
      .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
      .where(eq(groupBuys.id, groupBuyId));

    // Create orders for all participants (no cart involved)
    const participants = await db.select().from(groupBuyParticipants)
      .where(eq(groupBuyParticipants.groupBuyId, groupBuyId));

    const productRow = group.productId
      ? (await db.select().from(products).where(eq(products.id, group.productId)).limit(1))[0]
      : null;

    for (const p of participants) {
      const pLockedPrice = parseFloat(p.lockedPrice);
      const totalUsdd = (pLockedPrice * p.quantity).toFixed(6);
      const orderNumber = `GB${Date.now().toString(36).toUpperCase()}${nanoid(4).toUpperCase()}`;

      // Get participant's default address
      const [defaultAddr] = await db.select().from(addresses)
        .where(and(eq(addresses.userId, p.userId), eq(addresses.isDefault, 1)));
      const [anyAddr] = defaultAddr
        ? [defaultAddr]
        : await db.select().from(addresses).where(eq(addresses.userId, p.userId)).limit(1);

      await db.insert(orders).values({
        userId: p.userId,
        orderNumber,
        totalUsdd,
        status: "pending_payment",
        shippingAddress: anyAddr ? {
          fullName: anyAddr.fullName,
          phone: anyAddr.phone || undefined,
          country: anyAddr.country,
          state: anyAddr.state || undefined,
          city: anyAddr.city,
          addressLine1: anyAddr.addressLine1,
          addressLine2: anyAddr.addressLine2 || undefined,
          postalCode: anyAddr.postalCode || undefined,
        } : undefined,
        notes: `Group Buy: ${group.productName} | Discount: ${p.discountPct}% | Token: ${group.shareToken}`,
      });

      const [newOrder] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);

      if (productRow && newOrder) {
        const imgArr = Array.isArray(productRow.images) ? productRow.images as string[] : [];
        await db.insert(orderItems).values({
          orderId: newOrder.id,
          productId: group.productId!,
          productName: productRow.nameEn,
          productImage: imgArr[0] || productRow.aiGeneratedImageUrl || null,
          quantity: p.quantity,
          unitPriceUsdd: pLockedPrice.toFixed(6),
          subtotalUsdd: totalUsdd,
        });

        // Update participant with orderId
        await db.update(groupBuyParticipants)
          .set({ orderId: newOrder.id, txStatus: "completed" } as any)
          .where(eq(groupBuyParticipants.id, p.id));
      }

      // ── Auto-deduct USDD from participant wallet ────────────────────────
      const totalToPay = pLockedPrice * p.quantity;
      try {
        const wallet = await getOrCreateUsddWallet(p.userId);
        const currentBalance = parseFloat(wallet.balanceUsdd);
        if (currentBalance >= totalToPay) {
          const newBal = (currentBalance - totalToPay).toFixed(6);
          await db.update(usddWallets).set({
            balanceUsdd: newBal,
            totalSpentUsdd: (parseFloat(wallet.totalSpentUsdd) + totalToPay).toFixed(6),
          }).where(eq(usddWallets.userId, p.userId));

          await db.insert(usddTransactions).values({
            userId: p.userId,
            type: "payment",
            amountUsdd: totalToPay.toFixed(6),
            balanceAfterUsdd: newBal,
            status: "confirmed",
            note: `Group Buy: ${group.productName} | Order #${orderNumber}`,
            confirmedAt: new Date(),
          });

          // Mark order as paid
          if (newOrder) {
            await db.update(orders).set({
              status: "paid",
              paymentMethod: "usdd_balance",
              paymentConfirmedAt: new Date(),
            }).where(eq(orders.id, newOrder.id));
          }

          // Notify: payment success
          await createUserNotification({
            userId: p.userId,
            type: "new_order",
            title: "🎉 拼团成功！已自动扣款",
            body: `"${group.productName}" 拼团成功！已从您的 USDD 钱包扣款 ${totalToPay.toFixed(2)} USDD，订单 #${orderNumber} 已支付。`,
            link: `/orders/${newOrder?.id}`,
          });
        } else {
          // Insufficient balance — keep order as pending_payment, notify user
          await createUserNotification({
            userId: p.userId,
            type: "new_order",
            title: "🎉 拼团成功！请完成付款",
            body: `"${group.productName}" 拼团成功！但您的 USDD 余额不足（需 ${totalToPay.toFixed(2)} USDD，余额 ${currentBalance.toFixed(2)} USDD）。请前往钱包充值后完成支付。`,
            link: `/wallet`,
          });
        }
      } catch (_err) {
        // If deduction fails, keep order as pending_payment and notify
        await createUserNotification({
          userId: p.userId,
          type: "new_order",
          title: "🎉 拼团成功！订单已生成",
          body: `"${group.productName}" 拼团成功！您的订单 #${orderNumber} 已创建，请前往订单页完成付款。`,
          link: `/orders/${newOrder?.id}`,
        });
      }
    }
  } else {
    // Notify participant they've reserved a spot
    await createUserNotification({
      userId,
      type: "system",
      title: "✅ 已成功加入拼团",
      body: `您已加入 "${group.productName}" 拼团，当前 ${newRealCount}/${group.targetCount} 人。再邀请 ${group.targetCount - newRealCount} 人即可成团！`,
      link: `/group-buy/${group.shareToken}`,
    });
  }

  return { lockedPrice, discountPct: currentTier.discountPct, displayCount, currentTier, nextTier, isComplete };
}

/**
 * Process expired group buys — mark them as expired and notify participants.
 * Call this periodically (e.g., on each list query or via a scheduled job).
 */
export async function processExpiredGroupBuys() {
  const db = await getDb();
  if (!db) return { processed: 0 };

  const now = new Date();
  // Find open groups that have expired
  const expiredGroups = await db.select().from(groupBuys)
    .where(and(eq(groupBuys.status, "open")));

  let processed = 0;
  for (const group of expiredGroups) {
    if (now > group.expiresAt) {
      await db.update(groupBuys)
        .set({ status: "expired", updatedAt: now })
        .where(eq(groupBuys.id, group.id));

      // Notify all participants that group buy failed (not enough people)
      const participants = await db.select().from(groupBuyParticipants)
        .where(eq(groupBuyParticipants.groupBuyId, group.id));

      for (const p of participants) {
        await createUserNotification({
          userId: p.userId,
          type: "system",
          title: "拼团失效",
          body: `抱歉，"${group.productName}" 拼团已到期，共 ${group.currentCount}/${group.targetCount} 人参与，未凑够成团。您的占位已自动取消，无需任何操作。`,
          link: `/group-buy`,
        });
      }
      processed++;
    }
  }
  return { processed };
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
