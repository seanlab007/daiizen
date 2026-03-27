import {
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

// ─── International Site Management Enums ─────────────────────────────────────

// 定价模式枚举
export const priceModeEnum = pgEnum("price_mode", [
  "FOLLOW",    // 跟随模式：根据源站点价格和汇率同步
  "OVERRIDE",  // 独立模式：手动设置固定价格
]);

// 价格规则类型枚举
export const priceRuleTypeEnum = pgEnum("price_rule_type", [
  "EXCHANGE_RATE",    // 汇率同步：目标价格 = 源价格 × 汇率
  "PERCENTAGE",       // 百分比调整：目标价格 = 源价格 × 汇率 × (1 + 百分比)
  "FIXED_AMOUNT",     // 固定金额：目标价格 = 源价格 × 汇率 + 固定金额
]);

// 同步状态枚举
export const syncStatusEnum = pgEnum("sync_status", [
  "PENDING",    // 待处理
  "IN_PROGRESS", // 同步中
  "SUCCESS",    // 成功
  "FAILED",     // 失败
  "SKIPPED",    // 跳过（目标站点已有该商品）
]);

// 同步类型枚举
export const syncTypeEnum = pgEnum("sync_type", [
  "PRODUCT",    // 仅同步商品信息
  "PRICE",      // 仅同步价格
  "BOTH",       // 同步商品和价格
]);

// 站点状态枚举
export const siteStatusEnum = pgEnum("site_status", [
  "ACTIVE",     // 活跃
  "INACTIVE",   // 未启用
  "MAINTENANCE", // 维护中
]);

// ─── Sites (销售站点) ─────────────────────────────────────────────────────────

export const sites = pgTable("sites", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),           // 站点名称 (如: Amazon US)
  code: varchar("code", { length: 16 }).notNull().unique(),  // 站点代码 (如: US, UK, DE)
  currency: varchar("currency", { length: 8 }).notNull(),     // 货币代码 (如: USD, GBP, EUR)
  currencySymbol: varchar("currencySymbol", { length: 8 }),   // 货币符号 (如: $, £, €)
  domain: varchar("domain", { length: 128 }),                 // 域名 (如: amazon.com)
  isSourceEnabled: integer("isSourceEnabled").default(1).notNull(), // 是否可作为源站点
  isTargetEnabled: integer("isTargetEnabled").default(1).notNull(), // 是否可作为目标站点
  status: siteStatusEnum("status").default("ACTIVE").notNull(),
  sortOrder: integer("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Site = typeof sites.$inferSelect;
export type InsertSite = typeof sites.$inferInsert;

// ─── Price Rules (价格规则) ───────────────────────────────────────────────────

export const priceRules = pgTable("priceRules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),              // 规则名称
  description: text("description"),                               // 规则描述
  ruleType: priceRuleTypeEnum("ruleType").notNull(),             // 规则类型
  adjustmentValue: decimal("adjustmentValue", { precision: 18, scale: 4 }).default("0"), // 调整值（百分比或固定金额）
  isDefault: integer("isDefault").default(0).notNull(),          // 是否为默认规则
  isActive: integer("isActive").default(1).notNull(),            // 是否启用
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PriceRule = typeof priceRules.$inferSelect;
export type InsertPriceRule = typeof priceRules.$inferInsert;

// ─── Exchange Rates (汇率) ────────────────────────────────────────────────────

export const exchangeRates = pgTable("exchangeRates", {
  id: serial("id").primaryKey(),
  baseCurrency: varchar("baseCurrency", { length: 8 }).notNull().default("USDD"), // 基准货币
  targetCurrency: varchar("targetCurrency", { length: 8 }).notNull(),               // 目标货币
  rate: decimal("rate", { precision: 24, scale: 8 }).notNull(),                       // 汇率
  source: varchar("source", { length: 64 }),                                         // 数据来源
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),                          // 获取时间
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type InsertExchangeRate = typeof exchangeRates.$inferInsert;

// ─── International Links (国际商品关联) ───────────────────────────────────────

export const internationalLinks = pgTable("internationalLinks", {
  id: serial("id").primaryKey(),
  sourceSiteId: integer("sourceSiteId").notNull().references(() => sites.id),     // 源站点ID
  targetSiteId: integer("targetSiteId").notNull().references(() => sites.id),      // 目标站点ID
  
  // 商品关联
  sourceProductId: integer("sourceProductId").notNull(),   // 源站点商品ID（平台商品表的外键）
  targetProductId: integer("targetProductId"),              // 目标站点商品ID（创建后生成）
  
  // 价格配置
  priceMode: priceModeEnum("priceMode").default("FOLLOW").notNull(),  // 定价模式
  priceRuleId: integer("priceRuleId").references(() => priceRules.id), // 价格规则ID（可选）
  overridePrice: decimal("overridePrice", { precision: 18, scale: 6 }), // 独立定价金额
  
  // 同步配置
  syncProductInfo: integer("syncProductInfo").default(1).notNull(),  // 是否同步商品信息
  syncPrice: integer("syncPrice").default(1).notNull(),             // 是否同步价格
  
  // 状态
  syncStatus: syncStatusEnum("syncStatus").default("PENDING").notNull(), // 同步状态
  lastSyncedAt: timestamp("lastSyncedAt"),                            // 最后同步时间
  lastError: text("lastError"),                                       // 最后错误信息
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type InternationalLink = typeof internationalLinks.$inferSelect;
export type InsertInternationalLink = typeof internationalLinks.$inferInsert;

// ─── Sync Logs (同步日志) ─────────────────────────────────────────────────────

export const syncLogs = pgTable("syncLogs", {
  id: serial("id").primaryKey(),
  linkId: integer("linkId").references(() => internationalLinks.id).notNull(),  // 关联ID
  syncType: syncTypeEnum("syncType").notNull(),                                 // 同步类型
  status: syncStatusEnum("status").notNull(),                                   // 状态
  
  // 同步详情
  sourcePrice: decimal("sourcePrice", { precision: 18, scale: 6 }),            // 源价格
  targetPrice: decimal("targetPrice", { precision: 18, scale: 6 }),            // 目标价格
  exchangeRate: decimal("exchangeRate", { precision: 24, scale: 8 }),           // 使用的汇率
  priceMode: priceModeEnum("priceMode"),                                         // 使用的定价模式
  priceRuleId: integer("priceRuleId"),                                           // 使用的价格规则
  
  // 错误信息
  errorMessage: text("errorMessage"),
  errorDetails: json("errorDetails").$type<Record<string, unknown>>(),
  
  // 元数据
  triggeredBy: varchar("triggeredBy", { length: 64 }),  // 触发方式 (manual, scheduled, webhook)
  duration: integer("duration"),  // 同步耗时（毫秒）
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SyncLog = typeof syncLogs.$inferSelect;
export type InsertSyncLog = typeof syncLogs.$inferInsert;

// ─── Scheduled Sync Tasks (定时同步任务) ───────────────────────────────────────

export const scheduledSyncTasks = pgTable("scheduledSyncTasks", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),                    // 任务名称
  description: text("description"),                                     // 任务描述
  
  // 同步范围
  sourceSiteId: integer("sourceSiteId").references(() => sites.id),    // 源站点
  targetSiteIds: json("targetSiteIds").$type<number[]>(),                // 目标站点列表
  
  // 同步配置
  syncType: syncTypeEnum("syncType").default("BOTH").notNull(),         // 同步类型
  productFilter: json("productFilter").$type<{                           // 商品筛选条件
    categoryIds?: number[];
    minPrice?: string;
    maxPrice?: string;
    productIds?: number[];
  }>(),
  
  // 调度配置
  cronExpression: varchar("cronExpression", { length: 64 }),            // Cron表达式
  isActive: integer("isActive").default(1).notNull(),                   // 是否启用
  
  // 执行状态
  lastRunAt: timestamp("lastRunAt"),                                    // 上次执行时间
  lastRunStatus: syncStatusEnum("lastRunStatus"),                       // 上次执行状态
  nextRunAt: timestamp("nextRunAt"),                                     // 下次执行时间
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ScheduledSyncTask = typeof scheduledSyncTasks.$inferSelect;
export type InsertScheduledSyncTask = typeof scheduledSyncTasks.$inferInsert;

// ─── Link Price History (价格变更历史) ────────────────────────────────────────

export const linkPriceHistory = pgTable("linkPriceHistory", {
  id: serial("id").primaryKey(),
  linkId: integer("linkId").references(() => internationalLinks.id).notNull(),  // 关联ID
  priceMode: priceModeEnum("priceMode").notNull(),                               // 定价模式
  priceRuleId: integer("priceRuleId"),                                           // 价格规则ID
  sourcePrice: decimal("sourcePrice", { precision: 18, scale: 6 }),               // 源价格
  targetPrice: decimal("targetPrice", { precision: 18, scale: 6 }),               // 目标价格
  exchangeRate: decimal("exchangeRate", { precision: 24, scale: 8 }),            // 汇率
  changedBy: varchar("changedBy", { length: 64 }),                                // 变更人
  changeReason: text("changeReason"),                                             // 变更原因
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LinkPriceHistory = typeof linkPriceHistory.$inferSelect;
