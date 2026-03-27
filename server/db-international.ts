import { getDb } from "./db";
import { eq as eqDrizzle, and, inArray, gte, lte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  sites,
  priceRules,
  exchangeRates,
  internationalLinks,
  syncLogs,
  linkPriceHistory,
  scheduledSyncTasks,
  type Site,
  type InsertSite,
  type PriceRule,
  type InsertPriceRule,
  type InternationalLink,
  type InsertInternationalLink,
  type SyncLog,
  type InsertSyncLog,
  type LinkPriceHistory,
  type ScheduledSyncTask,
  type InsertScheduledSyncTask,
} from "../drizzle/schema-international";
import { products } from "../drizzle/schema";

// ─── 计算目标价格 ─────────────────────────────────────────────────────────────

/**
 * 根据定价规则计算目标站点价格
 */
export function calculateTargetPrice(
  sourcePrice: number,
  exchangeRate: number,
  ruleType: "EXCHANGE_RATE" | "PERCENTAGE" | "FIXED_AMOUNT",
  adjustmentValue: number
): number {
  switch (ruleType) {
    case "EXCHANGE_RATE":
      return sourcePrice * exchangeRate;
    case "PERCENTAGE":
      // adjustmentValue 是百分比，如 5 表示 +5%
      return sourcePrice * exchangeRate * (1 + adjustmentValue / 100);
    case "FIXED_AMOUNT":
      // adjustmentValue 是固定金额
      return sourcePrice * exchangeRate + adjustmentValue;
    default:
      return sourcePrice * exchangeRate;
  }
}

/**
 * 获取汇率
 */
export async function getExchangeRate(
  baseCurrency: string,
  targetCurrency: string
): Promise<number> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  const [rate] = await db
    .select()
    .from(exchangeRates)
    .where(
      and(
        eqDrizzle(exchangeRates.baseCurrency, baseCurrency),
        eqDrizzle(exchangeRates.targetCurrency, targetCurrency)
      )
    );
  
  if (!rate) {
    // 如果没有找到汇率，返回 1:1
    console.warn(`Exchange rate not found for ${baseCurrency} to ${targetCurrency}, using 1:1`);
    return 1;
  }
  
  return parseFloat(rate.rate);
}

// ─── Sites ─────────────────────────────────────────────────────────────────────

export async function getSites(): Promise<Site[]> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  return db.select().from(sites).orderBy(sites.sortOrder);
}

export async function getActiveSites(): Promise<Site[]> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  return db.select().from(sites).where(eqDrizzle(sites.status, "ACTIVE")).orderBy(sites.sortOrder);
}

export async function createSite(data: InsertSite): Promise<Site> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  const [site] = await db.insert(sites).values(data).returning();
  return site;
}

export async function updateSite(id: number, data: Partial<InsertSite>): Promise<Site> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  const [site] = await db
    .update(sites)
    .set({ ...data, updatedAt: new Date() })
    .where(eqDrizzle(sites.id, id))
    .returning();
  
  return site;
}

export async function deleteSite(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  await db.delete(sites).where(eqDrizzle(sites.id, id));
}

// ─── Price Rules ───────────────────────────────────────────────────────────────

export async function getPriceRules(): Promise<PriceRule[]> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  return db.select().from(priceRules).orderBy(priceRules.isDefault);
}

export async function getPriceRuleById(id: number): Promise<PriceRule | null> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  const [rule] = await db.select().from(priceRules).where(eqDrizzle(priceRules.id, id));
  return rule ?? null;
}

export async function createPriceRule(data: InsertPriceRule): Promise<PriceRule> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  // 如果设置为默认规则，先取消其他默认规则
  if (data.isDefault === 1) {
    await db.update(priceRules).set({ isDefault: 0, updatedAt: new Date() });
  }
  
  const [rule] = await db.insert(priceRules).values(data).returning();
  return rule;
}

export async function updatePriceRule(id: number, data: Partial<InsertPriceRule>): Promise<PriceRule> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  // 如果设置为默认规则，先取消其他默认规则
  if (data.isDefault === 1) {
    await db.update(priceRules).set({ isDefault: 0, updatedAt: new Date() });
  }
  
  const [rule] = await db
    .update(priceRules)
    .set({ ...data, updatedAt: new Date() })
    .where(eqDrizzle(priceRules.id, id))
    .returning();
  
  return rule;
}

export async function deletePriceRule(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  await db.delete(priceRules).where(eqDrizzle(priceRules.id, id));
}

// ─── Exchange Rates ─────────────────────────────────────────────────────────────

export async function getAllExchangeRates(): Promise<typeof exchangeRates.$inferSelect[]> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  return db.select().from(exchangeRates);
}

export async function updateExchangeRate(
  baseCurrency: string,
  targetCurrency: string,
  rate: number,
  source?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  await db
    .insert(exchangeRates)
    .values({
      baseCurrency,
      targetCurrency,
      rate: rate.toString(),
      source,
      fetchedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [exchangeRates.baseCurrency, exchangeRates.targetCurrency],
      set: {
        rate: rate.toString(),
        source,
        fetchedAt: new Date(),
      },
    });
}

export async function refreshExchangeRates(): Promise<{ success: boolean; updated: number }> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  try {
    // 获取所有活跃站点
    const activeSites = await db.select().from(sites).where(eqDrizzle(sites.status, "ACTIVE"));
    
    // 从免费的汇率API获取数据
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    const data = await response.json() as { rates: Record<string, number> };
    
    let updated = 0;
    for (const site of activeSites) {
      if (site.currency !== "USD" && data.rates[site.currency]) {
        await updateExchangeRate("USD", site.currency, data.rates[site.currency], "exchangerate-api");
        updated++;
      }
    }
    
    return { success: true, updated };
  } catch (error) {
    console.error("Failed to refresh exchange rates:", error);
    return { success: false, updated: 0 };
  }
}

// ─── International Links ────────────────────────────────────────────────────────

export interface InternationalLinkWithDetails extends InternationalLink {
  sourceSite?: Site;
  targetSite?: Site;
  sourceProduct?: typeof products.$inferSelect;
  priceRule?: PriceRule;
}

export async function getInternationalLinks(filters?: {
  sourceSiteId?: number;
  targetSiteId?: number;
  status?: string;
}): Promise<InternationalLinkWithDetails[]> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  const conditions = [];
  if (filters?.sourceSiteId) {
    conditions.push(eqDrizzle(internationalLinks.sourceSiteId, filters.sourceSiteId));
  }
  if (filters?.targetSiteId) {
    conditions.push(eqDrizzle(internationalLinks.targetSiteId, filters.targetSiteId));
  }
  if (filters?.status) {
    conditions.push(eqDrizzle(internationalLinks.syncStatus, filters.status as any));
  }
  
  const links = conditions.length > 0
    ? await db.select().from(internationalLinks).where(and(...conditions))
    : await db.select().from(internationalLinks);
  
  // 获取关联的站点和商品信息
  const result: InternationalLinkWithDetails[] = [];
  for (const link of links) {
    const [sourceSite] = await db.select().from(sites).where(eqDrizzle(sites.id, link.sourceSiteId));
    const [targetSite] = await db.select().from(sites).where(eqDrizzle(sites.id, link.targetSiteId));
    const [sourceProduct] = link.sourceProductId
      ? await db.select().from(products).where(eqDrizzle(products.id, link.sourceProductId))
      : [undefined];
    const priceRule = link.priceRuleId
      ? await getPriceRuleById(link.priceRuleId)
      : null;
    
    result.push({
      ...link,
      sourceSite,
      targetSite,
      sourceProduct,
      priceRule,
    });
  }
  
  return result;
}

export async function getInternationalLinkById(id: number): Promise<InternationalLinkWithDetails | null> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  const [link] = await db.select().from(internationalLinks).where(eqDrizzle(internationalLinks.id, id));
  
  if (!link) return null;
  
  const [sourceSite] = await db.select().from(sites).where(eqDrizzle(sites.id, link.sourceSiteId));
  const [targetSite] = await db.select().from(sites).where(eqDrizzle(sites.id, link.targetSiteId));
  const [sourceProduct] = link.sourceProductId
    ? await db.select().from(products).where(eqDrizzle(products.id, link.sourceProductId))
    : [undefined];
  const priceRule = link.priceRuleId
    ? await getPriceRuleById(link.priceRuleId)
    : null;
  
  return {
    ...link,
    sourceSite,
    targetSite,
    sourceProduct,
    priceRule,
  };
}

export async function createInternationalLink(data: InsertInternationalLink): Promise<InternationalLink> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  const [link] = await db.insert(internationalLinks).values(data).returning();
  return link;
}

export async function updateInternationalLink(
  id: number,
  data: Partial<InsertInternationalLink>,
  changeReason?: string
): Promise<InternationalLink> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  // 获取当前记录
  const [currentLink] = await db.select().from(internationalLinks).where(eqDrizzle(internationalLinks.id, id));
  
  // 记录价格变更历史
  if (data.priceMode || data.priceRuleId || data.overridePrice) {
    const [sourceSite] = await db.select().from(sites).where(eqDrizzle(sites.id, currentLink.sourceSiteId));
    const [targetSite] = await db.select().from(sites).where(eqDrizzle(sites.id, currentLink.targetSiteId));
    
    let sourcePrice = 0;
    let targetPrice = 0;
    let exchangeRate = 1;
    
    if (currentLink.sourceProductId) {
      const [product] = await db.select().from(products).where(eqDrizzle(products.id, currentLink.sourceProductId));
      if (product) {
        sourcePrice = parseFloat(product.priceUsdd);
      }
    }
    
    if (data.priceMode === "OVERRIDE" && data.overridePrice) {
      targetPrice = parseFloat(data.overridePrice);
    } else if (sourcePrice > 0 && targetSite && sourceSite) {
      exchangeRate = await getExchangeRate(sourceSite.currency, targetSite.currency);
      const rule = data.priceRuleId ? await getPriceRuleById(data.priceRuleId) : await getDefaultPriceRule();
      if (rule) {
        targetPrice = calculateTargetPrice(
          sourcePrice,
          exchangeRate,
          rule.ruleType as "EXCHANGE_RATE" | "PERCENTAGE" | "FIXED_AMOUNT",
          parseFloat(rule.adjustmentValue || "0")
        );
      }
    }
    
    await db.insert(linkPriceHistory).values({
      linkId: id,
      priceMode: data.priceMode || currentLink.priceMode,
      priceRuleId: data.priceRuleId || currentLink.priceRuleId,
      sourcePrice: sourcePrice.toString(),
      targetPrice: targetPrice.toString(),
      exchangeRate: exchangeRate.toString(),
      changedBy: "system",
      changeReason: changeReason || "Price configuration updated",
    });
  }
  
  const [link] = await db
    .update(internationalLinks)
    .set({ ...data, updatedAt: new Date() })
    .where(eqDrizzle(internationalLinks.id, id))
    .returning();
  
  return link;
}

export async function deleteInternationalLink(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  await db.delete(internationalLinks).where(eqDrizzle(internationalLinks.id, id));
}

async function getDefaultPriceRule(): Promise<PriceRule | null> {
  const db = await getDb();
  if (!db) return null;
  
  const [rule] = await db.select().from(priceRules).where(eqDrizzle(priceRules.isDefault, 1));
  return rule ?? null;
}

// ─── 批量创建关联 ─────────────────────────────────────────────────────────────

export async function batchCreateInternationalLinks(
  sourceSiteId: number,
  targetSiteIds: number[],
  sourceProductIds: number[],
  options?: {
    priceRuleId?: number;
    syncProductInfo?: boolean;
    syncPrice?: boolean;
  }
): Promise<{ success: number; failed: number; errors: string[] }> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  let success = 0;
  let failed = 0;
  const errors: string[] = [];
  
  for (const targetSiteId of targetSiteIds) {
    for (const sourceProductId of sourceProductIds) {
      try {
        // 检查是否已存在关联
        const existing = await db
          .select()
          .from(internationalLinks)
          .where(
            and(
              eqDrizzle(internationalLinks.sourceSiteId, sourceSiteId),
              eqDrizzle(internationalLinks.targetSiteId, targetSiteId),
              eqDrizzle(internationalLinks.sourceProductId, sourceProductId)
            )
          );
        
        if (existing.length > 0) {
          errors.push(`Link already exists for product ${sourceProductId} to site ${targetSiteId}`);
          failed++;
          continue;
        }
        
        await db.insert(internationalLinks).values({
          sourceSiteId,
          targetSiteId,
          sourceProductId,
          priceMode: "FOLLOW",
          priceRuleId: options?.priceRuleId,
          syncProductInfo: options?.syncProductInfo ?? 1,
          syncPrice: options?.syncPrice ?? 1,
          syncStatus: "PENDING",
        });
        
        success++;
      } catch (error) {
        errors.push(`Failed to create link for product ${sourceProductId}: ${error}`);
        failed++;
      }
    }
  }
  
  return { success, failed, errors };
}

// ─── 价格同步 ─────────────────────────────────────────────────────────────────

export interface SyncResult {
  linkId: number;
  success: boolean;
  sourcePrice: number;
  targetPrice: number;
  exchangeRate: number;
  error?: string;
}

export async function syncLinkPrices(linkId: number): Promise<SyncResult> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  const startTime = Date.now();
  
  try {
    // 获取链接信息
    const link = await getInternationalLinkById(linkId);
    if (!link) {
      throw new Error("Link not found");
    }
    
    if (!link.sourceProduct) {
      throw new Error("Source product not found");
    }
    
    if (!link.sourceSite || !link.targetSite) {
      throw new Error("Site configuration missing");
    }
    
    const sourcePrice = parseFloat(link.sourceProduct.priceUsdd);
    
    // 获取汇率
    const exchangeRate = await getExchangeRate(link.sourceSite.currency, link.targetSite.currency);
    
    let targetPrice: number;
    
    if (link.priceMode === "OVERRIDE") {
      // 独立定价模式
      targetPrice = parseFloat(link.overridePrice || "0");
    } else {
      // 跟随模式
      const rule = link.priceRuleId
        ? await getPriceRuleById(link.priceRuleId)
        : await getDefaultPriceRule();
      
      targetPrice = calculateTargetPrice(
        sourcePrice,
        exchangeRate,
        rule?.ruleType as "EXCHANGE_RATE" | "PERCENTAGE" | "FIXED_AMOUNT" || "EXCHANGE_RATE",
        parseFloat(rule?.adjustmentValue || "0")
      );
    }
    
    // 更新链接状态
    await db
      .update(internationalLinks)
      .set({
        syncStatus: "SUCCESS",
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eqDrizzle(internationalLinks.id, linkId));
    
    // 记录同步日志
    await db.insert(syncLogs).values({
      linkId,
      syncType: "PRICE",
      status: "SUCCESS",
      sourcePrice: sourcePrice.toString(),
      targetPrice: targetPrice.toString(),
      exchangeRate: exchangeRate.toString(),
      priceMode: link.priceMode,
      priceRuleId: link.priceRuleId,
      duration: Date.now() - startTime,
      triggeredBy: "manual",
    });
    
    return {
      linkId,
      success: true,
      sourcePrice,
      targetPrice,
      exchangeRate,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // 更新链接状态为失败
    await db
      .update(internationalLinks)
      .set({
        syncStatus: "FAILED",
        lastError: errorMessage,
        updatedAt: new Date(),
      })
      .where(eqDrizzle(internationalLinks.id, linkId));
    
    // 记录同步日志
    await db.insert(syncLogs).values({
      linkId,
      syncType: "PRICE",
      status: "FAILED",
      errorMessage,
      duration: Date.now() - startTime,
      triggeredBy: "manual",
    });
    
    return {
      linkId,
      success: false,
      sourcePrice: 0,
      targetPrice: 0,
      exchangeRate: 1,
      error: errorMessage,
    };
  }
}

export async function syncAllLinks(
  sourceSiteId?: number,
  targetSiteId?: number
): Promise<{ success: number; failed: number; results: SyncResult[] }> {
  const filters: Parameters<typeof getInternationalLinks>[0] = {};
  if (sourceSiteId) filters.sourceSiteId = sourceSiteId;
  if (targetSiteId) filters.targetSiteId = targetSiteId;
  
  const links = await getInternationalLinks(filters);
  
  let success = 0;
  let failed = 0;
  const results: SyncResult[] = [];
  
  for (const link of links) {
    const result = await syncLinkPrices(link.id);
    results.push(result);
    if (result.success) {
      success++;
    } else {
      failed++;
    }
  }
  
  return { success, failed, results };
}

// ─── 预览价格计算 ─────────────────────────────────────────────────────────────

export async function previewPrice(
  sourcePrice: number,
  sourceCurrency: string,
  targetCurrency: string,
  ruleType: "EXCHANGE_RATE" | "PERCENTAGE" | "FIXED_AMOUNT",
  adjustmentValue: number
): Promise<{
  exchangeRate: number;
  calculatedPrice: number;
  formula: string;
}> {
  const exchangeRate = await getExchangeRate(sourceCurrency, targetCurrency);
  const calculatedPrice = calculateTargetPrice(sourcePrice, exchangeRate, ruleType, adjustmentValue);
  
  let formula = "";
  switch (ruleType) {
    case "EXCHANGE_RATE":
      formula = `${sourcePrice} × ${exchangeRate} = ${calculatedPrice.toFixed(2)}`;
      break;
    case "PERCENTAGE":
      formula = `${sourcePrice} × ${exchangeRate} × ${(1 + adjustmentValue / 100).toFixed(2)} = ${calculatedPrice.toFixed(2)}`;
      break;
    case "FIXED_AMOUNT":
      formula = `${sourcePrice} × ${exchangeRate} + ${adjustmentValue} = ${calculatedPrice.toFixed(2)}`;
      break;
  }
  
  return {
    exchangeRate,
    calculatedPrice,
    formula,
  };
}

// ─── 同步日志 ─────────────────────────────────────────────────────────────────

export async function getSyncLogs(
  linkId?: number,
  limit: number = 100
): Promise<SyncLog[]> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  if (linkId) {
    return db
      .select()
      .from(syncLogs)
      .where(eqDrizzle(syncLogs.linkId, linkId))
      .orderBy(syncLogs.createdAt)
      .limit(limit);
  }
  
  return db.select().from(syncLogs).orderBy(syncLogs.createdAt).limit(limit);
}

// ─── 定时任务 ─────────────────────────────────────────────────────────────────

export async function getScheduledTasks(): Promise<ScheduledSyncTask[]> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  return db.select().from(scheduledSyncTasks).orderBy(scheduledSyncTasks.isActive);
}

export async function createScheduledTask(data: InsertScheduledSyncTask): Promise<ScheduledSyncTask> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  const [task] = await db.insert(scheduledSyncTasks).values(data).returning();
  return task;
}

export async function updateScheduledTask(
  id: number,
  data: Partial<InsertScheduledSyncTask>
): Promise<ScheduledSyncTask> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  const [task] = await db
    .update(scheduledSyncTasks)
    .set({ ...data, updatedAt: new Date() })
    .where(eqDrizzle(scheduledSyncTasks.id, id))
    .returning();
  
  return task;
}

export async function deleteScheduledTask(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  await db.delete(scheduledSyncTasks).where(eqDrizzle(scheduledSyncTasks.id, id));
}

// ─── 价格历史 ─────────────────────────────────────────────────────────────────

export async function getLinkPriceHistory(linkId: number): Promise<LinkPriceHistory[]> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  return db
    .select()
    .from(linkPriceHistory)
    .where(eqDrizzle(linkPriceHistory.linkId, linkId))
    .orderBy(linkPriceHistory.createdAt);
}

// ─── 统计数据 ─────────────────────────────────────────────────────────────────

export async function getInternationalStats(): Promise<{
  totalLinks: number;
  activeLinks: number;
  syncedToday: number;
  failedLinks: number;
  byTargetSite: Array<{ siteId: number; siteName: string; count: number }>;
}> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  const allLinks = await db.select().from(internationalLinks);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let activeLinks = 0;
  let syncedToday = 0;
  let failedLinks = 0;
  
  const siteCounts: Record<number, { name: string; count: number }> = {};
  
  for (const link of allLinks) {
    if (link.syncStatus === "SUCCESS") activeLinks++;
    if (link.syncStatus === "FAILED") failedLinks++;
    if (link.lastSyncedAt && new Date(link.lastSyncedAt) >= today) syncedToday++;
    
    if (!siteCounts[link.targetSiteId]) {
      const [site] = await db.select().from(sites).where(eqDrizzle(sites.id, link.targetSiteId));
      siteCounts[link.targetSiteId] = { name: site?.name || "Unknown", count: 0 };
    }
    siteCounts[link.targetSiteId].count++;
  }
  
  return {
    totalLinks: allLinks.length,
    activeLinks,
    syncedToday,
    failedLinks,
    byTargetSite: Object.entries(siteCounts).map(([siteId, data]) => ({
      siteId: parseInt(siteId),
      siteName: data.name,
      count: data.count,
    })),
  };
}
