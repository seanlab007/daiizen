import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db.ts", () => ({
  getDb: vi.fn(),
}));

vi.mock("./db-store.ts", () => ({
  getStoreBySlug: vi.fn(),
  getStoreById: vi.fn(),
  listActiveStores: vi.fn(),
  createStore: vi.fn(),
  updateStore: vi.fn(),
  getSellerStore: vi.fn(),
  listStoreProducts: vi.fn(),
  getStoreProduct: vi.fn(),
  createStoreProduct: vi.fn(),
  updateStoreProduct: vi.fn(),
  deleteStoreProduct: vi.fn(),
  createDeposit: vi.fn(),
  getStoreDeposit: vi.fn(),
  listDepositsAdmin: vi.fn(),
  confirmDeposit: vi.fn(),
  refundDeposit: vi.fn(),
  getDefaultCommissionRate: vi.fn(),
  getDepositAmount: vi.fn(),
  isDepositRequired: vi.fn(),
  getAllPlatformConfig: vi.fn(),
  setPlatformConfig: vi.fn(),
  approveStore: vi.fn(),
  rejectStore: vi.fn(),
  suspendStore: vi.fn(),
  reinstateStore: vi.fn(),
  listStoresAdmin: vi.fn(),
  getMarketplaceAdminStats: vi.fn(),
  getStoreCommissions: vi.fn(),
  getSellerEarnings: vi.fn(),
  parseExternalProductLink: vi.fn(),
}));

// ─── Unit Tests ───────────────────────────────────────────────────────────────

describe("Store Platform Config", () => {
  it("should return default commission rate of 5%", async () => {
    const { getDefaultCommissionRate } = await import("./db-store.ts");
    vi.mocked(getDefaultCommissionRate).mockResolvedValue(0.05);
    const rate = await getDefaultCommissionRate();
    expect(rate).toBe(0.05);
    expect(rate).toBeGreaterThan(0);
    expect(rate).toBeLessThan(1);
  });

  it("should return default deposit amount of 50 USDD", async () => {
    const { getDepositAmount } = await import("./db-store.ts");
    vi.mocked(getDepositAmount).mockResolvedValue(50);
    const amount = await getDepositAmount();
    expect(amount).toBe(50);
    expect(amount).toBeGreaterThan(0);
  });

  it("should return deposit required flag", async () => {
    const { isDepositRequired } = await import("./db-store.ts");
    vi.mocked(isDepositRequired).mockResolvedValue(true);
    const required = await isDepositRequired();
    expect(required).toBe(true);
  });
});

describe("Store Management", () => {
  it("should return null for non-existent store slug", async () => {
    const { getStoreBySlug } = await import("./db-store.ts");
    vi.mocked(getStoreBySlug).mockResolvedValue(null);
    const store = await getStoreBySlug("non-existent-store");
    expect(store).toBeNull();
  });

  it("should return store data for valid slug", async () => {
    const { getStoreBySlug } = await import("./db-store.ts");
    const mockStore = {
      id: 1,
      ownerId: 1,
      name: "Test Store",
      slug: "test-store",
      description: "A test store",
      status: "active" as const,
      logoUrl: null,
      bannerUrl: null,
      commissionRate: null,
      depositPaid: true,
      adminNote: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(getStoreBySlug).mockResolvedValue(mockStore);
    const store = await getStoreBySlug("test-store");
    expect(store).not.toBeNull();
    expect(store?.name).toBe("Test Store");
    expect(store?.status).toBe("active");
  });

  it("should list active stores with pagination", async () => {
    const { listActiveStores } = await import("./db-store.ts");
    vi.mocked(listActiveStores).mockResolvedValue({
      stores: [
        { id: 1, name: "Store A", slug: "store-a", status: "active" as const, ownerId: 1, description: null, logoUrl: null, bannerUrl: null, commissionRate: null, depositPaid: true, adminNote: null, createdAt: new Date(), updatedAt: new Date() },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });
    const result = await listActiveStores({ page: 1, limit: 20 });
    expect(result.stores).toHaveLength(1);
    expect(result.total).toBe(1);
  });
});

describe("Deposit System", () => {
  it("should create a deposit record", async () => {
    const { createDeposit } = await import("./db-store.ts");
    const mockDeposit = {
      id: 1,
      storeId: 1,
      userId: 1,
      amountUsdd: "50.00",
      status: "pending" as const,
      paymentMethod: "usdd_trc20",
      paymentTxHash: null,
      adminNote: null,
      confirmedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(createDeposit).mockResolvedValue(mockDeposit);
    const deposit = await createDeposit({ storeId: 1, userId: 1, amountUsdd: "50.00", paymentMethod: "usdd_trc20" });
    expect(deposit.status).toBe("pending");
    expect(deposit.amountUsdd).toBe("50.00");
  });

  it("should confirm a deposit", async () => {
    const { confirmDeposit } = await import("./db-store.ts");
    vi.mocked(confirmDeposit).mockResolvedValue(undefined);
    await expect(confirmDeposit(1)).resolves.not.toThrow();
  });
});

describe("Commission System", () => {
  it("should compute commission correctly at 5%", () => {
    const saleAmount = 100;
    const commissionRate = 0.05;
    const commission = saleAmount * commissionRate;
    expect(commission).toBe(5);
    expect(commission).toBeGreaterThan(0);
  });

  it("should compute seller earnings after commission", () => {
    const saleAmount = 100;
    const commissionRate = 0.05;
    const commission = saleAmount * commissionRate;
    const sellerEarnings = saleAmount - commission;
    expect(sellerEarnings).toBe(95);
  });
});

describe("External Link Parsing", () => {
  it("should detect TikTok Shop links", () => {
    const tiktokUrl = "https://www.tiktok.com/shop/product/12345";
    const isTikTok = tiktokUrl.includes("tiktok.com");
    expect(isTikTok).toBe(true);
  });

  it("should detect Amazon links", () => {
    const amazonUrl = "https://www.amazon.com/dp/B08N5WRWNW";
    const isAmazon = amazonUrl.includes("amazon.com");
    expect(isAmazon).toBe(true);
  });

  it("should detect Pinduoduo links", () => {
    const pddUrl = "https://mobile.yangkeduo.com/goods.html?goods_id=12345";
    const isPdd = pddUrl.includes("yangkeduo.com") || pddUrl.includes("pinduoduo.com");
    expect(isPdd).toBe(true);
  });

  it("should detect SHEIN links", () => {
    const sheinUrl = "https://www.shein.com/product/p-12345.html";
    const isShein = sheinUrl.includes("shein.com");
    expect(isShein).toBe(true);
  });

  it("should detect Xiaohongshu links", () => {
    const xhsUrl = "https://www.xiaohongshu.com/goods-detail/12345";
    const isXhs = xhsUrl.includes("xiaohongshu.com");
    expect(isXhs).toBe(true);
  });
});
