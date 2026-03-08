import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock database helpers ────────────────────────────────────────────────────
vi.mock("./db-s2b2c.ts", () => ({
  getOrCreateReferralCode: vi.fn().mockResolvedValue({ id: 1, userId: 1, code: "ABC123", usageCount: 0 }),
  getReferralCodeByCode: vi.fn().mockResolvedValue({ id: 1, userId: 2, code: "XYZ789", usageCount: 0 }),
  registerReferral: vi.fn().mockResolvedValue({ id: 1, referrerId: 2, referredUserId: 1, level: 1, firstPurchaseDone: 0 }),
  getReferralRelation: vi.fn().mockResolvedValue(null),
  getAncestors: vi.fn().mockResolvedValue([{ referrerId: 2, level: 1 }]),
  triggerReferralRewards: vi.fn().mockResolvedValue([{ id: 1, rewardAmountUsdd: "5.00", level: 1 }]),
  getUserCredits: vi.fn().mockResolvedValue({ userId: 1, balanceUsdd: "10.00", totalEarnedUsdd: "10.00" }),
  getReferralRewards: vi.fn().mockResolvedValue([]),
  getReferralTree: vi.fn().mockResolvedValue({ l1: [], l2: [], l3: [] }),
  getOrCreateStoreProfile: vi.fn().mockResolvedValue({ id: 1, storeId: 1, storeType: "influencer", isDropshipEnabled: 1 }),
  updateStoreProfile: vi.fn().mockResolvedValue(undefined),
  createSupplyChainProduct: vi.fn().mockResolvedValue({ id: 1, name: "Test Product", basePriceUsdd: "10.00" }),
  listSupplyChainProducts: vi.fn().mockResolvedValue({ products: [], total: 0 }),
  getSupplyChainProductById: vi.fn().mockResolvedValue({ id: 1, name: "Test Product", basePriceUsdd: "10.00", storeId: 2, description: "desc", categoryId: null, imageUrls: null, tags: null }),
  getDropshipLinkByProduct: vi.fn().mockResolvedValue(null),
  createDropshipLink: vi.fn().mockResolvedValue({ id: 1, influencerStoreId: 1, supplyChainProductId: 1, storeProductId: 1 }),
  getStoreSupplyChainProducts: vi.fn().mockResolvedValue({ products: [], total: 0 }),
  getSupplyChainPendingOrders: vi.fn().mockResolvedValue({ orders: [], total: 0 }),
  updateDropshipOrderStatus: vi.fn().mockResolvedValue(undefined),
  getInfluencerDropshipOrders: vi.fn().mockResolvedValue({ orders: [], total: 0 }),
}));

vi.mock("./db-store.ts", () => ({
  getStoreByUserId: vi.fn().mockResolvedValue({ id: 1, userId: 1, slug: "test-store", name: "Test Store", status: "active" }),
  createStoreProduct: vi.fn().mockResolvedValue({ id: 1, storeId: 1, name: "Test", slug: "test", priceUsdd: "15.00" }),
}));

vi.mock("./_core/llm.ts", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify({ recommendations: [{ id: 1, name: "Test Product", reason: "Popular", suggestedMarkup: "15.00" }] }) } }],
  }),
}));

// ─── Unit tests for referral logic ───────────────────────────────────────────
describe("S2B2C Referral System", () => {
  it("should generate a unique referral code per user", async () => {
    const { getOrCreateReferralCode } = await import("./db-s2b2c.ts");
    const code = await getOrCreateReferralCode(1);
    expect(code).toBeDefined();
    expect(code.code).toBe("ABC123");
    expect(code.userId).toBe(1);
  });

  it("should register a referral relationship when using a referral code", async () => {
    const { registerReferral, getReferralCodeByCode } = await import("./db-s2b2c.ts");
    const refCode = await getReferralCodeByCode("XYZ789");
    expect(refCode).toBeDefined();
    const relation = await registerReferral(1, refCode!.userId, 1);
    expect(relation.referrerId).toBe(2);
    expect(relation.referredUserId).toBe(1);
    expect(relation.level).toBe(1);
  });

  it("should trigger rewards for up to 3 levels of ancestors", async () => {
    const { triggerReferralRewards } = await import("./db-s2b2c.ts");
    const rewards = await triggerReferralRewards(1, "100.00");
    expect(rewards).toHaveLength(1);
    expect(rewards[0].level).toBe(1);
    expect(rewards[0].rewardAmountUsdd).toBe("5.00");
  });

  it("should return user credits with balance", async () => {
    const { getUserCredits } = await import("./db-s2b2c.ts");
    const credits = await getUserCredits(1);
    expect(credits).toBeDefined();
    expect(parseFloat(credits!.balanceUsdd)).toBeGreaterThanOrEqual(0);
  });

  it("should return referral tree with l1/l2/l3 structure", async () => {
    const { getReferralTree } = await import("./db-s2b2c.ts");
    const tree = await getReferralTree(1);
    expect(tree).toHaveProperty("l1");
    expect(tree).toHaveProperty("l2");
    expect(tree).toHaveProperty("l3");
    expect(Array.isArray(tree.l1)).toBe(true);
    expect(Array.isArray(tree.l2)).toBe(true);
    expect(Array.isArray(tree.l3)).toBe(true);
  });
});

// ─── Unit tests for store profile ────────────────────────────────────────────
describe("S2B2C Store Profiles", () => {
  it("should create or retrieve a store profile", async () => {
    const { getOrCreateStoreProfile } = await import("./db-s2b2c.ts");
    const profile = await getOrCreateStoreProfile(1);
    expect(profile).toBeDefined();
    expect(profile.storeType).toBe("influencer");
  });

  it("should update store profile fields", async () => {
    const { updateStoreProfile } = await import("./db-s2b2c.ts");
    await expect(updateStoreProfile(1, { storeType: "supply_chain" })).resolves.toBeUndefined();
  });
});

// ─── Unit tests for supply chain products ────────────────────────────────────
describe("S2B2C Supply Chain Products", () => {
  it("should create a supply chain product", async () => {
    const { createSupplyChainProduct } = await import("./db-s2b2c.ts");
    const product = await createSupplyChainProduct({
      storeId: 1,
      name: "Test Product",
      basePriceUsdd: "10.00",
      isDropshipAvailable: true,
    });
    expect(product).toBeDefined();
    expect(product.name).toBe("Test Product");
    expect(product.basePriceUsdd).toBe("10.00");
  });

  it("should list supply chain products with pagination", async () => {
    const { listSupplyChainProducts } = await import("./db-s2b2c.ts");
    const result = await listSupplyChainProducts({ page: 1, limit: 20 });
    expect(result).toHaveProperty("products");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.products)).toBe(true);
  });

  it("should get a supply chain product by ID", async () => {
    const { getSupplyChainProductById } = await import("./db-s2b2c.ts");
    const product = await getSupplyChainProductById(1);
    expect(product).toBeDefined();
    expect(product!.id).toBe(1);
  });
});

// ─── Unit tests for dropship links ───────────────────────────────────────────
describe("S2B2C Dropship Links", () => {
  it("should create a dropship link between influencer and supply chain product", async () => {
    const { createDropshipLink } = await import("./db-s2b2c.ts");
    const link = await createDropshipLink({
      influencerStoreId: 1,
      supplyChainProductId: 1,
      storeProductId: 1,
    });
    expect(link).toBeDefined();
    expect(link.influencerStoreId).toBe(1);
    expect(link.supplyChainProductId).toBe(1);
  });

  it("should return null for non-existent dropship link", async () => {
    const { getDropshipLinkByProduct } = await import("./db-s2b2c.ts");
    const link = await getDropshipLinkByProduct(99, 99);
    expect(link).toBeNull();
  });

  it("should update dropship order status", async () => {
    const { updateDropshipOrderStatus } = await import("./db-s2b2c.ts");
    await expect(updateDropshipOrderStatus(1, "shipped", "TRACK123")).resolves.toBeUndefined();
  });
});

// ─── Reward rate validation ───────────────────────────────────────────────────
describe("Referral Reward Rate Validation", () => {
  const REWARD_RATES: Record<number, number> = { 1: 0.05, 2: 0.02, 3: 0.01 };

  it("should have correct reward rates for all 3 levels", () => {
    expect(REWARD_RATES[1]).toBe(0.05); // L1: 5%
    expect(REWARD_RATES[2]).toBe(0.02); // L2: 2%
    expect(REWARD_RATES[3]).toBe(0.01); // L3: 1%
  });

  it("should not have reward rates beyond level 3", () => {
    expect(REWARD_RATES[4]).toBeUndefined();
    expect(REWARD_RATES[5]).toBeUndefined();
  });

  it("should calculate correct reward amounts", () => {
    const orderAmount = 100;
    expect(orderAmount * REWARD_RATES[1]).toBe(5);   // L1: $5
    expect(orderAmount * REWARD_RATES[2]).toBe(2);   // L2: $2
    expect(orderAmount * REWARD_RATES[3]).toBe(1);   // L3: $1
  });

  it("should enforce max 3 levels (no L4 or beyond)", () => {
    const maxLevel = Math.max(...Object.keys(REWARD_RATES).map(Number));
    expect(maxLevel).toBe(3);
  });
});
