import { router, publicProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getSites,
  getActiveSites,
  createSite,
  updateSite,
  deleteSite,
  getPriceRules,
  getPriceRuleById,
  createPriceRule,
  updatePriceRule,
  deletePriceRule,
  getAllExchangeRates,
  updateExchangeRate,
  refreshExchangeRates,
  getInternationalLinks,
  getInternationalLinkById,
  createInternationalLink,
  updateInternationalLink,
  deleteInternationalLink,
  batchCreateInternationalLinks,
  syncLinkPrices,
  syncAllLinks,
  previewPrice,
  getSyncLogs,
  getScheduledTasks,
  createScheduledTask,
  updateScheduledTask,
  deleteScheduledTask,
  getLinkPriceHistory,
  getInternationalStats,
} from "../db-international";

// ─── Admin Guard ───────────────────────────────────────────────────────────────

const adminOrStoreOwnerProcedure = adminProcedure; // TODO: Add store owner check

// ─── Sites Router ─────────────────────────────────────────────────────────────

export const sitesRouter = router({
  // 公开接口
  list: publicProcedure.query(() => getSites()),
  active: publicProcedure.query(() => getActiveSites()),
  
  // 管理员接口
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(64),
        code: z.string().min(1).max(16),
        currency: z.string().min(1).max(8),
        currencySymbol: z.string().max(8).optional(),
        domain: z.string().max(128).optional(),
        isSourceEnabled: z.boolean().default(true),
        isTargetEnabled: z.boolean().default(true),
        sortOrder: z.number().default(0),
      })
    )
    .mutation(({ input }) =>
      createSite({
        ...input,
        isSourceEnabled: input.isSourceEnabled ? 1 : 0,
        isTargetEnabled: input.isTargetEnabled ? 1 : 0,
      })
    ),
  
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(64).optional(),
        currency: z.string().min(1).max(8).optional(),
        currencySymbol: z.string().max(8).optional(),
        domain: z.string().max(128).optional(),
        isSourceEnabled: z.boolean().optional(),
        isTargetEnabled: z.boolean().optional(),
        status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]).optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return updateSite(id, {
        ...data,
        isSourceEnabled: data.isSourceEnabled !== undefined ? (data.isSourceEnabled ? 1 : 0) : undefined,
        isTargetEnabled: data.isTargetEnabled !== undefined ? (data.isTargetEnabled ? 1 : 0) : undefined,
      } as any);
    }),
  
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteSite(input.id)),
});

// ─── Price Rules Router ────────────────────────────────────────────────────────

export const priceRulesRouter = router({
  list: publicProcedure.query(() => getPriceRules()),
  
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => {
      const rule = getPriceRuleById(input.id);
      if (!rule) throw new TRPCError({ code: "NOT_FOUND", message: "Price rule not found" });
      return rule;
    }),
  
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(128),
        description: z.string().optional(),
        ruleType: z.enum(["EXCHANGE_RATE", "PERCENTAGE", "FIXED_AMOUNT"]),
        adjustmentValue: z.string().default("0"),
        isDefault: z.boolean().default(false),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(({ input }) =>
      createPriceRule({
        ...input,
        adjustmentValue: input.adjustmentValue,
        isDefault: input.isDefault ? 1 : 0,
        isActive: input.isActive ? 1 : 0,
      })
    ),
  
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(128).optional(),
        description: z.string().optional(),
        ruleType: z.enum(["EXCHANGE_RATE", "PERCENTAGE", "FIXED_AMOUNT"]).optional(),
        adjustmentValue: z.string().optional(),
        isDefault: z.boolean().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return updatePriceRule(id, {
        ...data,
        adjustmentValue: data.adjustmentValue,
        isDefault: data.isDefault !== undefined ? (data.isDefault ? 1 : 0) : undefined,
        isActive: data.isActive !== undefined ? (data.isActive ? 1 : 0) : undefined,
      } as any);
    }),
  
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deletePriceRule(input.id)),
});

// ─── Exchange Rates Router ────────────────────────────────────────────────────

export const exchangeRatesRouter = router({
  list: publicProcedure.query(() => getAllExchangeRates()),
  
  update: adminProcedure
    .input(
      z.object({
        baseCurrency: z.string().min(1).max(8),
        targetCurrency: z.string().min(1).max(8),
        rate: z.string(),
        source: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      const { baseCurrency, targetCurrency, rate, source } = input;
      return updateExchangeRate(baseCurrency, targetCurrency, parseFloat(rate), source);
    }),
  
  refresh: adminProcedure.mutation(() => refreshExchangeRates()),
});

// ─── International Links Router ─────────────────────────────────────────────────

export const internationalLinksRouter = router({
  list: publicProcedure
    .input(
      z.object({
        sourceSiteId: z.number().optional(),
        targetSiteId: z.number().optional(),
        status: z.string().optional(),
      })
    )
    .query(({ input }) => getInternationalLinks(input)),
  
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => {
      const link = getInternationalLinkById(input.id);
      if (!link) throw new TRPCError({ code: "NOT_FOUND", message: "International link not found" });
      return link;
    }),
  
  create: adminProcedure
    .input(
      z.object({
        sourceSiteId: z.number(),
        targetSiteId: z.number(),
        sourceProductId: z.number(),
        priceMode: z.enum(["FOLLOW", "OVERRIDE"]).default("FOLLOW"),
        priceRuleId: z.number().optional(),
        overridePrice: z.string().optional(),
        syncProductInfo: z.boolean().default(true),
        syncPrice: z.boolean().default(true),
      })
    )
    .mutation(({ input }) =>
      createInternationalLink({
        ...input,
        overridePrice: input.overridePrice,
        syncProductInfo: input.syncProductInfo ? 1 : 0,
        syncPrice: input.syncPrice ? 1 : 0,
      })
    ),
  
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        priceMode: z.enum(["FOLLOW", "OVERRIDE"]).optional(),
        priceRuleId: z.number().nullable().optional(),
        overridePrice: z.string().nullable().optional(),
        syncProductInfo: z.boolean().optional(),
        syncPrice: z.boolean().optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return updateInternationalLink(id, {
        ...data,
        overridePrice: data.overridePrice,
        syncProductInfo: data.syncProductInfo !== undefined ? (data.syncProductInfo ? 1 : 0) : undefined,
        syncPrice: data.syncPrice !== undefined ? (data.syncPrice ? 1 : 0) : undefined,
      } as any);
    }),
  
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteInternationalLink(input.id)),
  
  batchCreate: adminProcedure
    .input(
      z.object({
        sourceSiteId: z.number(),
        targetSiteIds: z.array(z.number()),
        sourceProductIds: z.array(z.number()),
        priceRuleId: z.number().optional(),
        syncProductInfo: z.boolean().default(true),
        syncPrice: z.boolean().default(true),
      })
    )
    .mutation(({ input }) => {
      const { sourceSiteId, targetSiteIds, sourceProductIds, ...options } = input;
      return batchCreateInternationalLinks(
        sourceSiteId,
        targetSiteIds,
        sourceProductIds,
        options
      );
    }),
  
  // 同步单个链接的价格
  syncPrice: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => syncLinkPrices(input.id)),
  
  // 批量同步
  syncAll: adminProcedure
    .input(
      z.object({
        sourceSiteId: z.number().optional(),
        targetSiteId: z.number().optional(),
      })
    )
    .mutation(({ input }) => syncAllLinks(input.sourceSiteId, input.targetSiteId)),
  
  // 价格预览
  previewPrice: publicProcedure
    .input(
      z.object({
        sourcePrice: z.number(),
        sourceCurrency: z.string(),
        targetCurrency: z.string(),
        ruleType: z.enum(["EXCHANGE_RATE", "PERCENTAGE", "FIXED_AMOUNT"]),
        adjustmentValue: z.number(),
      })
    )
    .mutation(({ input }) => previewPrice(
      input.sourcePrice,
      input.sourceCurrency,
      input.targetCurrency,
      input.ruleType,
      input.adjustmentValue
    )),
  
  // 获取价格历史
  priceHistory: publicProcedure
    .input(z.object({ linkId: z.number() }))
    .query(({ input }) => getLinkPriceHistory(input.linkId)),
});

// ─── Sync Logs Router ─────────────────────────────────────────────────────────

export const syncLogsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        linkId: z.number().optional(),
        limit: z.number().min(1).max(500).default(100),
      })
    )
    .query(({ input }) => getSyncLogs(input.linkId, input.limit)),
});

// ─── Scheduled Tasks Router ───────────────────────────────────────────────────

export const scheduledTasksRouter = router({
  list: publicProcedure.query(() => getScheduledTasks()),
  
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(128),
        description: z.string().optional(),
        sourceSiteId: z.number(),
        targetSiteIds: z.array(z.number()),
        syncType: z.enum(["PRODUCT", "PRICE", "BOTH"]).default("BOTH"),
        productFilter: z.object({
          categoryIds: z.array(z.number()).optional(),
          minPrice: z.string().optional(),
          maxPrice: z.string().optional(),
          productIds: z.array(z.number()).optional(),
        }).optional(),
        cronExpression: z.string(),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(({ input }) =>
      createScheduledTask({
        ...input,
        isActive: input.isActive ? 1 : 0,
      })
    ),
  
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(128).optional(),
        description: z.string().optional(),
        targetSiteIds: z.array(z.number()).optional(),
        syncType: z.enum(["PRODUCT", "PRICE", "BOTH"]).optional(),
        productFilter: z.any().optional(),
        cronExpression: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return updateScheduledTask(id, {
        ...data,
        isActive: data.isActive !== undefined ? (data.isActive ? 1 : 0) : undefined,
      } as any);
    }),
  
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteScheduledTask(input.id)),
});

// ─── Stats Router ─────────────────────────────────────────────────────────────

export const internationalStatsRouter = router({
  get: adminProcedure.query(() => getInternationalStats()),
});

// ─── Main International Router ────────────────────────────────────────────────

export const internationalRouter = router({
  sites: sitesRouter,
  priceRules: priceRulesRouter,
  exchangeRates: exchangeRatesRouter,
  links: internationalLinksRouter,
  syncLogs: syncLogsRouter,
  scheduledTasks: scheduledTasksRouter,
  stats: internationalStatsRouter,
});
