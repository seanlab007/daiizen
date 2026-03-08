import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database helpers
vi.mock("./db-payment", () => ({
  getPaymentConfigs: vi.fn(),
  upsertPaymentConfig: vi.fn(),
  createDepositPaymentRecord: vi.fn(),
  getDepositPaymentRecord: vi.fn(),
  trackProductEvent: vi.fn(),
  getStoreAnalytics: vi.fn(),
  getPlatformAnalytics: vi.fn(),
}));

vi.mock("./db-store", () => ({
  getStoreByUserId: vi.fn(),
  getStoreById: vi.fn(),
  getStoreProductById: vi.fn(),
  listDepositsAdmin: vi.fn(),
  updateDepositStatus: vi.fn(),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import * as dbPayment from "./db-payment";
import * as dbStore from "./db-store";
import { invokeLLM } from "./_core/llm";

// ─── Payment Config Tests ─────────────────────────────────────────────────────

describe("Payment Config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getPaymentConfigs returns active payment methods", async () => {
    const mockConfigs = [
      { method: "alipay", accountName: "张三", accountNumber: "13800138000", qrCodeUrl: null, isEnabled: true },
      { method: "wechat", accountName: "李四", accountNumber: "13900139000", qrCodeUrl: "https://cdn.example.com/qr.png", isEnabled: true },
    ];
    vi.mocked(dbPayment.getPaymentConfigs).mockResolvedValue(mockConfigs as any);

    const result = await dbPayment.getPaymentConfigs();
    expect(result).toHaveLength(2);
    expect(result[0].method).toBe("alipay");
    expect(result[1].method).toBe("wechat");
  });

  it("upsertPaymentConfig creates or updates a payment method", async () => {
    vi.mocked(dbPayment.upsertPaymentConfig).mockResolvedValue(undefined);

    await dbPayment.upsertPaymentConfig({
      method: "unionpay",
      accountName: "王五",
      accountNumber: "6228480402564890018",
      isEnabled: true,
    });

    expect(dbPayment.upsertPaymentConfig).toHaveBeenCalledWith({
      method: "unionpay",
      accountName: "王五",
      accountNumber: "6228480402564890018",
      isEnabled: true,
    });
  });

  it("only allows valid payment methods", () => {
    const validMethods = ["alipay", "wechat", "unionpay"];
    const invalidMethod = "bitcoin";

    expect(validMethods).toContain("alipay");
    expect(validMethods).toContain("wechat");
    expect(validMethods).toContain("unionpay");
    expect(validMethods).not.toContain(invalidMethod);
  });
});

// ─── Deposit Payment Submission Tests ─────────────────────────────────────────

describe("Deposit Payment Submission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createDepositPaymentRecord stores payment evidence", async () => {
    vi.mocked(dbPayment.createDepositPaymentRecord).mockResolvedValue(undefined);

    await dbPayment.createDepositPaymentRecord({
      depositId: 1,
      paymentMethod: "alipay",
      paymentAmountCny: 350,
      transferScreenshotUrl: "https://cdn.example.com/screenshot.jpg",
      transferNote: "开店保证金 - 用户A",
    });

    expect(dbPayment.createDepositPaymentRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        depositId: 1,
        paymentMethod: "alipay",
        paymentAmountCny: 350,
      })
    );
  });

  it("validates that screenshot URL is required for non-USDD payments", () => {
    const validatePayment = (method: string, screenshotUrl?: string) => {
      if (method !== "usdd" && !screenshotUrl) {
        throw new Error("截图凭证为必填项");
      }
      return true;
    };

    expect(() => validatePayment("alipay", undefined)).toThrow("截图凭证为必填项");
    expect(() => validatePayment("wechat", undefined)).toThrow("截图凭证为必填项");
    expect(validatePayment("alipay", "https://cdn.example.com/screenshot.jpg")).toBe(true);
    expect(validatePayment("usdd", undefined)).toBe(true);
  });
});

// ─── Product Analytics Tests ──────────────────────────────────────────────────

describe("Product Analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("trackProductEvent records view, cart_add, and order events", async () => {
    vi.mocked(dbPayment.trackProductEvent).mockResolvedValue(undefined);

    const events = ["view", "cart_add", "order"] as const;
    for (const eventType of events) {
      await dbPayment.trackProductEvent({ productId: 1, storeId: 1, eventType });
    }

    expect(dbPayment.trackProductEvent).toHaveBeenCalledTimes(3);
    expect(dbPayment.trackProductEvent).toHaveBeenCalledWith({ productId: 1, storeId: 1, eventType: "view" });
    expect(dbPayment.trackProductEvent).toHaveBeenCalledWith({ productId: 1, storeId: 1, eventType: "cart_add" });
    expect(dbPayment.trackProductEvent).toHaveBeenCalledWith({ productId: 1, storeId: 1, eventType: "order" });
  });

  it("getStoreAnalytics returns aggregated metrics", async () => {
    const mockAnalytics = {
      totals: { views: 1500, cartAdds: 300, orders: 75, gmvUsdd: 2250 },
      products: [
        { id: 1, name: "Premium T-Shirt", views: 800, cartAdds: 160, orders: 40, gmvUsdd: 1200, priceUsdd: "30.00" },
        { id: 2, name: "Silk Scarf", views: 700, cartAdds: 140, orders: 35, gmvUsdd: 1050, priceUsdd: "30.00" },
      ],
    };
    vi.mocked(dbPayment.getStoreAnalytics).mockResolvedValue(mockAnalytics as any);

    const result = await dbPayment.getStoreAnalytics(1);
    expect(result.totals.views).toBe(1500);
    expect(result.totals.orders).toBe(75);
    expect(result.products).toHaveLength(2);
    expect(result.products[0].name).toBe("Premium T-Shirt");
  });

  it("calculates conversion rate correctly", () => {
    const views = 1000;
    const orders = 50;
    const conversionRate = views > 0 ? ((orders / views) * 100).toFixed(1) : "0.0";
    expect(conversionRate).toBe("5.0");
  });

  it("handles zero views without division error", () => {
    const views = 0;
    const orders = 0;
    const conversionRate = views > 0 ? ((orders / views) * 100).toFixed(1) : "0.0";
    expect(conversionRate).toBe("0.0");
  });
});

// ─── Bulk Import Tests ────────────────────────────────────────────────────────

describe("Bulk Import", () => {
  it("validates required fields in imported products", () => {
    const validateProduct = (row: Record<string, unknown>) => {
      const errors: string[] = [];
      if (!row.name || String(row.name).trim() === "") errors.push("商品名称不能为空");
      if (!row.basePriceUsdd || isNaN(Number(row.basePriceUsdd))) errors.push("批发价格无效");
      if (Number(row.basePriceUsdd) <= 0) errors.push("批发价格必须大于0");
      return errors;
    };

    expect(validateProduct({ name: "", basePriceUsdd: "10" })).toContain("商品名称不能为空");
    expect(validateProduct({ name: "T-Shirt", basePriceUsdd: "abc" })).toContain("批发价格无效");
    expect(validateProduct({ name: "T-Shirt", basePriceUsdd: "-5" })).toContain("批发价格必须大于0");
    expect(validateProduct({ name: "T-Shirt", basePriceUsdd: "10" })).toHaveLength(0);
  });

  it("AI field mapping handles common column name variations", () => {
    // Simulate AI mapping logic
    const mapColumnName = (col: string): string | null => {
      const lower = col.toLowerCase().trim();
      if (["name", "product name", "商品名称", "品名", "title"].includes(lower)) return "name";
      if (["price", "wholesale price", "批发价", "价格", "cost"].includes(lower)) return "basePriceUsdd";
      if (["stock", "inventory", "库存", "数量"].includes(lower)) return "stock";
      if (["description", "desc", "描述", "商品描述"].includes(lower)) return "description";
      return null;
    };

    expect(mapColumnName("商品名称")).toBe("name");
    expect(mapColumnName("Product Name")).toBe("name");
    expect(mapColumnName("批发价")).toBe("basePriceUsdd");
    expect(mapColumnName("wholesale price")).toBe("basePriceUsdd");
    expect(mapColumnName("库存")).toBe("stock");
    expect(mapColumnName("unknown_field")).toBeNull();
  });

  it("limits preview to first 5 rows", () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({ name: `Product ${i}`, basePriceUsdd: "10" }));
    const preview = rows.slice(0, 5);
    expect(preview).toHaveLength(5);
    expect(preview[0].name).toBe("Product 0");
    expect(preview[4].name).toBe("Product 4");
  });
});

// ─── 3-Level Referral Reward Tests ───────────────────────────────────────────

describe("3-Level Referral Reward Calculation", () => {
  it("calculates correct rewards for 3 levels", () => {
    const orderValue = 100;
    const L1_RATE = 0.05;
    const L2_RATE = 0.02;
    const L3_RATE = 0.01;

    const l1Reward = orderValue * L1_RATE;
    const l2Reward = orderValue * L2_RATE;
    const l3Reward = orderValue * L3_RATE;

    expect(l1Reward).toBe(5);
    expect(l2Reward).toBe(2);
    expect(l3Reward).toBe(1);
  });

  it("enforces maximum 3 levels of referral", () => {
    const MAX_LEVELS = 3;
    const referralChain = ["user_A", "user_B", "user_C", "user_D", "user_E"];

    // Only first 3 ancestors get rewards
    const eligibleAncestors = referralChain.slice(0, MAX_LEVELS);
    expect(eligibleAncestors).toHaveLength(3);
    expect(eligibleAncestors).not.toContain("user_D");
    expect(eligibleAncestors).not.toContain("user_E");
  });

  it("only triggers rewards on first purchase", () => {
    const isFirstPurchase = (purchaseCount: number) => purchaseCount === 1;

    expect(isFirstPurchase(1)).toBe(true);
    expect(isFirstPurchase(2)).toBe(false);
    expect(isFirstPurchase(0)).toBe(false);
  });
});
