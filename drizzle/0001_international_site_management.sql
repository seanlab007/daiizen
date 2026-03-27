-- ═══════════════════════════════════════════════════════════════════════════════
-- International Site Management Tables
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Sites (销售站点) ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "sites" (
    "id" serial PRIMARY KEY,
    "name" varchar(64) NOT NULL,
    "code" varchar(16) NOT NULL UNIQUE,
    "currency" varchar(8) NOT NULL,
    "currencySymbol" varchar(8),
    "domain" varchar(128),
    "isSourceEnabled" integer NOT NULL DEFAULT 1,
    "isTargetEnabled" integer NOT NULL DEFAULT 1,
    "status" text NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" integer NOT NULL DEFAULT 0,
    "createdAt" timestamp NOT NULL DEFAULT NOW(),
    "updatedAt" timestamp NOT NULL DEFAULT NOW()
);

-- ─── Price Rules (价格规则) ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "priceRules" (
    "id" serial PRIMARY KEY,
    "name" varchar(128) NOT NULL,
    "description" text,
    "ruleType" text NOT NULL,
    "adjustmentValue" decimal(18,4) DEFAULT '0',
    "isDefault" integer NOT NULL DEFAULT 0,
    "isActive" integer NOT NULL DEFAULT 1,
    "createdAt" timestamp NOT NULL DEFAULT NOW(),
    "updatedAt" timestamp NOT NULL DEFAULT NOW()
);

-- ─── Exchange Rates (汇率) ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "exchangeRates" (
    "id" serial PRIMARY KEY,
    "baseCurrency" varchar(8) NOT NULL DEFAULT 'USDD',
    "targetCurrency" varchar(8) NOT NULL,
    "rate" decimal(24,8) NOT NULL,
    "source" varchar(64),
    "fetchedAt" timestamp NOT NULL DEFAULT NOW(),
    "createdAt" timestamp NOT NULL DEFAULT NOW(),
    UNIQUE("baseCurrency", "targetCurrency")
);

-- ─── International Links (国际商品关联) ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "internationalLinks" (
    "id" serial PRIMARY KEY,
    "sourceSiteId" integer NOT NULL REFERENCES "sites"("id"),
    "targetSiteId" integer NOT NULL REFERENCES "sites"("id"),
    "sourceProductId" integer NOT NULL,
    "targetProductId" integer,
    "priceMode" text NOT NULL DEFAULT 'FOLLOW',
    "priceRuleId" integer REFERENCES "priceRules"("id"),
    "overridePrice" decimal(18,6),
    "syncProductInfo" integer NOT NULL DEFAULT 1,
    "syncPrice" integer NOT NULL DEFAULT 1,
    "syncStatus" text NOT NULL DEFAULT 'PENDING',
    "lastSyncedAt" timestamp,
    "lastError" text,
    "createdAt" timestamp NOT NULL DEFAULT NOW(),
    "updatedAt" timestamp NOT NULL DEFAULT NOW()
);

-- ─── Sync Logs (同步日志) ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "syncLogs" (
    "id" serial PRIMARY KEY,
    "linkId" integer NOT NULL REFERENCES "internationalLinks"("id"),
    "syncType" text NOT NULL,
    "status" text NOT NULL,
    "sourcePrice" decimal(18,6),
    "targetPrice" decimal(18,6),
    "exchangeRate" decimal(24,8),
    "priceMode" text,
    "priceRuleId" integer,
    "errorMessage" text,
    "errorDetails" json,
    "triggeredBy" varchar(64),
    "duration" integer,
    "createdAt" timestamp NOT NULL DEFAULT NOW()
);

-- ─── Scheduled Sync Tasks (定时同步任务) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "scheduledSyncTasks" (
    "id" serial PRIMARY KEY,
    "name" varchar(128) NOT NULL,
    "description" text,
    "sourceSiteId" integer REFERENCES "sites"("id"),
    "targetSiteIds" json,
    "syncType" text NOT NULL DEFAULT 'BOTH',
    "productFilter" json,
    "cronExpression" varchar(64),
    "isActive" integer NOT NULL DEFAULT 1,
    "lastRunAt" timestamp,
    "lastRunStatus" text,
    "nextRunAt" timestamp,
    "createdAt" timestamp NOT NULL DEFAULT NOW(),
    "updatedAt" timestamp NOT NULL DEFAULT NOW()
);

-- ─── Link Price History (价格变更历史) ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "linkPriceHistory" (
    "id" serial PRIMARY KEY,
    "linkId" integer NOT NULL REFERENCES "internationalLinks"("id"),
    "priceMode" text NOT NULL,
    "priceRuleId" integer,
    "sourcePrice" decimal(18,6),
    "targetPrice" decimal(18,6),
    "exchangeRate" decimal(24,8),
    "changedBy" varchar(64),
    "changeReason" text,
    "createdAt" timestamp NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS "idx_internationalLinks_sourceSiteId" ON "internationalLinks"("sourceSiteId");
CREATE INDEX IF NOT EXISTS "idx_internationalLinks_targetSiteId" ON "internationalLinks"("targetSiteId");
CREATE INDEX IF NOT EXISTS "idx_internationalLinks_syncStatus" ON "internationalLinks"("syncStatus");
CREATE INDEX IF NOT EXISTS "idx_syncLogs_linkId" ON "syncLogs"("linkId");
CREATE INDEX IF NOT EXISTS "idx_syncLogs_createdAt" ON "syncLogs"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_linkPriceHistory_linkId" ON "linkPriceHistory"("linkId");
CREATE INDEX IF NOT EXISTS "idx_exchangeRates_currencies" ON "exchangeRates"("baseCurrency", "targetCurrency");

-- ═══════════════════════════════════════════════════════════════════════════════
-- Seed Data
-- ═══════════════════════════════════════════════════════════════════════════════

-- Insert default price rules
INSERT INTO "priceRules" ("name", "description", "ruleType", "adjustmentValue", "isDefault", "isActive")
VALUES
    ('Exchange Rate Only', 'Convert price using only exchange rate', 'EXCHANGE_RATE', '0', 1, 1),
    ('5% Markup', 'Add 5% markup on top of exchange rate', 'PERCENTAGE', '5', 0, 1),
    ('10% Markup', 'Add 10% markup on top of exchange rate', 'PERCENTAGE', '10', 0, 1),
    ('$0.50 Flat Fee', 'Add $0.50 flat fee on top of exchange rate', 'FIXED_AMOUNT', '0.5', 0, 1)
ON CONFLICT DO NOTHING;

-- Insert default exchange rates
INSERT INTO "exchangeRates" ("baseCurrency", "targetCurrency", "rate", "source", "fetchedAt")
VALUES
    ('USDD', 'USD', '1.00000000', 'default', NOW()),
    ('USDD', 'EUR', '0.92000000', 'default', NOW()),
    ('USDD', 'GBP', '0.79000000', 'default', NOW()),
    ('USDD', 'JPY', '150.00000000', 'default', NOW()),
    ('USDD', 'ARS', '850.00000000', 'default', NOW()),
    ('USDD', 'TRY', '32.00000000', 'default', NOW()),
    ('USDD', 'BRL', '5.00000000', 'default', NOW()),
    ('USDD', 'VES', '36.00000000', 'default', NOW()),
    ('USDD', 'NGN', '1550.00000000', 'default', NOW()),
    ('USDD', 'EGP', '31.00000000', 'default', NOW())
ON CONFLICT ("baseCurrency", "targetCurrency") DO NOTHING;
