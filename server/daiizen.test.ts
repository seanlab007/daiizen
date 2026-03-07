import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Helper: create a mock context ────────────────────────────────────────────
function makeCtx(overrides?: Partial<TrpcContext>): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as unknown as TrpcContext["res"],
    ...overrides,
  };
}

function makeAuthCtx(role: "user" | "admin" = "user"): TrpcContext {
  return makeCtx({
    user: {
      id: 1,
      openId: "test-user",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
  });
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
describe("auth", () => {
  it("auth.me returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("auth.me returns user for authenticated user", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.email).toBe("test@example.com");
  });

  it("auth.logout clears cookie and returns success", async () => {
    const clearedCookies: string[] = [];
    const ctx = makeAuthCtx();
    ctx.res.clearCookie = (name: string) => clearedCookies.push(name);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(clearedCookies.length).toBeGreaterThan(0);
  });
});

// ─── Products ─────────────────────────────────────────────────────────────────
describe("products", () => {
  it("products.list returns paginated results", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.products.list({ page: 1, limit: 10 });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("products.featured returns array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.products.featured({ limit: 4 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("products.bySlug throws NOT_FOUND for unknown slug", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.products.bySlug({ slug: "nonexistent-product-xyz" })).rejects.toThrow();
  });
});

// ─── Categories ───────────────────────────────────────────────────────────────
describe("categories", () => {
  it("categories.list returns array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.categories.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Exchange Rates ───────────────────────────────────────────────────────────
describe("exchangeRates", () => {
  it("exchangeRates.list returns array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.exchangeRates.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Admin guard ──────────────────────────────────────────────────────────────
describe("admin", () => {
  it("admin.stats throws UNAUTHORIZED for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("admin.stats throws FORBIDDEN for non-admin user", async () => {
    const caller = appRouter.createCaller(makeAuthCtx("user"));
    await expect(caller.admin.stats()).rejects.toThrow();
  });
});

// ─── Cart guard ───────────────────────────────────────────────────────────────
describe("cart", () => {
  it("cart.list throws UNAUTHORIZED for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.cart.list()).rejects.toThrow();
  });
});

// ─── Orders guard ─────────────────────────────────────────────────────────────
describe("orders", () => {
  it("orders.list throws UNAUTHORIZED for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.orders.list()).rejects.toThrow();
  });
});
