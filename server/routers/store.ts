import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getStoreByUserId,
  getStoreById,
  getStoreBySlug,
  createStore,
  updateStore,
  listActiveStores,
  listAllStoresAdmin,
  approveStore,
  rejectStore,
  suspendStore,
  reinstateStore,
  getStoreProducts,
  getStoreProductBySlug,
  getStoreProductById,
  createStoreProduct,
  updateStoreProduct,
  deleteStoreProduct,
  getMarketplaceProducts,
  createStoreDeposit,
  getDepositByStoreId,
  confirmDeposit,
  refundDeposit,
  listDepositsAdmin,
  getStoreCommissions,
  getStoreStats,
  getMarketplaceAdminStats,
  getPlatformConfig,
  setPlatformConfig,
  getAllPlatformConfig,
  getDefaultCommissionRate,
  getDepositAmount,
  isDepositRequired,
} from "../db-store";
import { invokeLLM } from "../_core/llm";
import { notifyOwner } from "../_core/notification";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

// Admin guard middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

// Seller guard: user must have an active store
const sellerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const store = await getStoreByUserId(ctx.user.id);
  if (!store) throw new TRPCError({ code: "NOT_FOUND", message: "You don't have a store" });
  if (store.status !== "active") {
    throw new TRPCError({ code: "FORBIDDEN", message: `Store is ${store.status}` });
  }
  return next({ ctx: { ...ctx, store } });
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
}

// Detect external platform from URL
function detectPlatform(url: string): string {
  if (url.includes("tiktok.com") || url.includes("tiktokshop")) return "tiktok";
  if (url.includes("pinduoduo.com") || url.includes("yangkeduo.com")) return "pinduoduo";
  if (url.includes("xiaohongshu.com") || url.includes("xhslink.com")) return "xiaohongshu";
  if (url.includes("amazon.com") || url.includes("amazon.co")) return "amazon";
  if (url.includes("shein.com")) return "shein";
  if (url.includes("taobao.com") || url.includes("tmall.com")) return "taobao";
  if (url.includes("jd.com")) return "jd";
  if (url.includes("lazada.com")) return "lazada";
  if (url.includes("shopee.com") || url.includes("shopee.")) return "shopee";
  return "other";
}

export const storeRouter = router({
  // ─── Public: Marketplace ────────────────────────────────────────────────────

  // Get platform config (deposit amount, commission rate)
  getConfig: publicProcedure.query(async () => {
    const [commissionRate, depositAmount, depositRequired] = await Promise.all([
      getDefaultCommissionRate(),
      getDepositAmount(),
      isDepositRequired(),
    ]);
    return { commissionRate, depositAmount, depositRequired };
  }),

  // List active stores
  listStores: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(({ input }) => listActiveStores(input)),

  // Get store by slug
  getStore: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const store = await getStoreBySlug(input.slug);
      if (!store || store.status !== "active") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Store not found" });
      }
      return store;
    }),

  // Get store products (public)
  getStoreProducts: publicProcedure
    .input(z.object({
      storeSlug: z.string(),
      search: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const store = await getStoreBySlug(input.storeSlug);
      if (!store || store.status !== "active") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Store not found" });
      }
      return getStoreProducts({ storeId: store.id, search: input.search, page: input.page, limit: input.limit });
    }),

  // Get single store product
  getStoreProduct: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const product = await getStoreProductBySlug(input.slug);
      if (!product || product.isActive === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }
      const store = await getStoreById(product.storeId);
      return { product, store };
    }),

  // Marketplace: all products from all active stores
  marketplace: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      categoryId: z.number().optional(),
      platform: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(({ input }) => getMarketplaceProducts(input)),

  // ─── Seller: My Store ────────────────────────────────────────────────────────

  // Get my store (or null if not a seller)
  myStore: protectedProcedure.query(async ({ ctx }) => {
    const store = await getStoreByUserId(ctx.user.id);
    return store;
  }),

  // Apply to open a store
  applyStore: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(128),
      description: z.string().max(2000).optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().max(32).optional(),
      country: z.string().max(64).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user already has a store
      const existing = await getStoreByUserId(ctx.user.id);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "You already have a store" });
      }

      // Generate unique slug
      let slug = slugify(input.name);
      const existing2 = await getStoreBySlug(slug);
      if (existing2) slug = `${slug}-${nanoid(6)}`;

      // Admin users skip deposit requirement
      const needsDeposit = ctx.user.role !== "admin" && await isDepositRequired();

      const store = await createStore({
        userId: ctx.user.id,
        slug,
        name: input.name,
        description: input.description,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        country: input.country,
        // Admin: auto-approve; others: pending until deposit confirmed
        status: ctx.user.role === "admin" ? "active" : "pending",
      });

      // Notify owner
      await notifyOwner({
        title: "New Store Application",
        content: `${ctx.user.name || ctx.user.email} applied to open store "${input.name}"${ctx.user.role === "admin" ? " (admin - auto-approved)" : ""}`,
      }).catch(() => {});

      return { store, needsDeposit };
    }),

  // Update store profile
  updateStore: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(128).optional(),
      description: z.string().max(2000).optional(),
      logoUrl: z.string().url().optional().nullable(),
      bannerUrl: z.string().url().optional().nullable(),
      contactEmail: z.string().email().optional().nullable(),
      contactPhone: z.string().max(32).optional().nullable(),
      country: z.string().max(64).optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const store = await getStoreByUserId(ctx.user.id);
      if (!store) throw new TRPCError({ code: "NOT_FOUND", message: "Store not found" });
      await updateStore(store.id, input);
      return { success: true };
    }),

  // My store stats
  myStoreStats: protectedProcedure.query(async ({ ctx }) => {
    const store = await getStoreByUserId(ctx.user.id);
    if (!store) throw new TRPCError({ code: "NOT_FOUND", message: "No store found" });
    return getStoreStats(store.id);
  }),

  // ─── Seller: Products ────────────────────────────────────────────────────────

  // List my products
  myProducts: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const store = await getStoreByUserId(ctx.user.id);
      if (!store) throw new TRPCError({ code: "NOT_FOUND", message: "No store found" });
      return getStoreProducts({ storeId: store.id, search: input.search, page: input.page, limit: input.limit, activeOnly: false });
    }),

  // Add product manually
  addProduct: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(256),
      description: z.string().max(5000).optional(),
      priceUsdd: z.number().positive(),
      originalPriceUsdd: z.number().positive().optional(),
      stock: z.number().int().min(0).default(0),
      images: z.array(z.string().url()).max(10).optional(),
      tags: z.array(z.string()).max(20).optional(),
      categoryId: z.number().int().optional(),
      weight: z.number().positive().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const store = await getStoreByUserId(ctx.user.id);
      if (!store) throw new TRPCError({ code: "NOT_FOUND", message: "No store found" });
      if (store.status !== "active") {
        throw new TRPCError({ code: "FORBIDDEN", message: `Store is ${store.status}` });
      }

      let slug = slugify(input.name);
      const existing = await getStoreProductBySlug(slug);
      if (existing) slug = `${slug}-${nanoid(6)}`;

      const product = await createStoreProduct({
        storeId: store.id,
        slug,
        name: input.name,
        description: input.description,
        priceUsdd: String(input.priceUsdd),
        originalPriceUsdd: input.originalPriceUsdd ? String(input.originalPriceUsdd) : undefined,
        stock: input.stock,
        images: input.images ?? [],
        tags: input.tags ?? [],
        categoryId: input.categoryId,
        weight: input.weight ? String(input.weight) : undefined,
      });

      return product;
    }),

  // Import product from external link (AI-powered)
  importFromLink: protectedProcedure
    .input(z.object({
      url: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      const store = await getStoreByUserId(ctx.user.id);
      if (!store) throw new TRPCError({ code: "NOT_FOUND", message: "No store found" });
      if (store.status !== "active") {
        throw new TRPCError({ code: "FORBIDDEN", message: `Store is ${store.status}` });
      }

      const platform = detectPlatform(input.url);

      // Use AI to extract product info from the URL
      const aiResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a product data extraction assistant. Given an e-commerce product URL, extract product information and return JSON. 
The platform is: ${platform}.
Return ONLY valid JSON with these fields:
{
  "name": "product name in English",
  "description": "product description in English (2-3 sentences)",
  "estimatedPriceUSD": number (estimated USD price, use 0 if unknown),
  "tags": ["tag1", "tag2"],
  "imageUrl": "main product image URL if extractable from URL pattern, otherwise null"
}`,
          },
          {
            role: "user",
            content: `Extract product info from this ${platform} URL: ${input.url}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "product_info",
            strict: true,
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                estimatedPriceUSD: { type: "number" },
                tags: { type: "array", items: { type: "string" } },
                imageUrl: { type: ["string", "null"] },
              },
              required: ["name", "description", "estimatedPriceUSD", "tags", "imageUrl"],
              additionalProperties: false,
            },
          },
        },
      });

      let extracted: {
        name: string;
        description: string;
        estimatedPriceUSD: number;
        tags: string[];
        imageUrl: string | null;
      };

      try {
        const content = aiResponse.choices[0].message.content;
        extracted = typeof content === "string" ? JSON.parse(content) : content;
      } catch {
        extracted = {
          name: `Product from ${platform}`,
          description: "Imported product",
          estimatedPriceUSD: 0,
          tags: [],
          imageUrl: null,
        };
      }

      // Convert USD to USDD (1:1 approximation)
      const priceUsdd = extracted.estimatedPriceUSD > 0 ? extracted.estimatedPriceUSD : 9.99;

      let slug = slugify(extracted.name);
      const existing = await getStoreProductBySlug(slug);
      if (existing) slug = `${slug}-${nanoid(6)}`;

      const images = extracted.imageUrl ? [extracted.imageUrl] : [];

      const product = await createStoreProduct({
        storeId: store.id,
        slug,
        name: extracted.name,
        description: extracted.description,
        priceUsdd: String(priceUsdd),
        stock: 999,
        images,
        tags: extracted.tags,
        externalPlatform: platform as any,
        externalUrl: input.url,
      });

      return { product, extracted };
    }),

  // Update product
  updateProduct: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(256).optional(),
      description: z.string().max(5000).optional(),
      priceUsdd: z.number().positive().optional(),
      originalPriceUsdd: z.number().positive().optional().nullable(),
      stock: z.number().int().min(0).optional(),
      images: z.array(z.string().url()).max(10).optional(),
      tags: z.array(z.string()).max(20).optional(),
      isActive: z.number().int().min(0).max(1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const store = await getStoreByUserId(ctx.user.id);
      if (!store) throw new TRPCError({ code: "NOT_FOUND", message: "No store found" });

      const product = await getStoreProductById(input.id);
      if (!product || product.storeId !== store.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      const { id, ...updateData } = input;
      await updateStoreProduct(id, {
        ...updateData,
        priceUsdd: updateData.priceUsdd ? String(updateData.priceUsdd) : undefined,
        originalPriceUsdd: updateData.originalPriceUsdd ? String(updateData.originalPriceUsdd) : undefined,
      });

      return { success: true };
    }),

  // Delete product
  deleteProduct: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const store = await getStoreByUserId(ctx.user.id);
      if (!store) throw new TRPCError({ code: "NOT_FOUND", message: "No store found" });

      const product = await getStoreProductById(input.id);
      if (!product || product.storeId !== store.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      await deleteStoreProduct(input.id);
      return { success: true };
    }),

  // ─── Seller: Deposit ─────────────────────────────────────────────────────────

  // Submit deposit payment
  submitDeposit: protectedProcedure
    .input(z.object({
      paymentMethod: z.string(),
      paymentTxHash: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const store = await getStoreByUserId(ctx.user.id);
      if (!store) throw new TRPCError({ code: "NOT_FOUND", message: "No store found" });

      const depositAmount = await getDepositAmount();

      const deposit = await createStoreDeposit({
        storeId: store.id,
        userId: ctx.user.id,
        amountUsdd: String(depositAmount),
        paymentMethod: input.paymentMethod,
        paymentTxHash: input.paymentTxHash,
      });

      await notifyOwner({
        title: "New Store Deposit",
        content: `Store "${store.name}" submitted deposit of ${depositAmount} USDD via ${input.paymentMethod}. Tx: ${input.paymentTxHash || "N/A"}`,
      }).catch(() => {});

      return deposit;
    }),

  // Get my deposit status
  myDeposit: protectedProcedure.query(async ({ ctx }) => {
    const store = await getStoreByUserId(ctx.user.id);
    if (!store) return null;
    return getDepositByStoreId(store.id);
  }),

  // My commission history
  myCommissions: protectedProcedure
    .input(z.object({ page: z.number().default(1), limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const store = await getStoreByUserId(ctx.user.id);
      if (!store) throw new TRPCError({ code: "NOT_FOUND", message: "No store found" });
      return getStoreCommissions(store.id, input);
    }),

  // ─── Admin: Store Management ─────────────────────────────────────────────────

  adminListStores: adminProcedure
    .input(z.object({
      status: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(({ input }) => listAllStoresAdmin(input)),

  adminApproveStore: adminProcedure
    .input(z.object({ id: z.number(), adminNote: z.string().optional() }))
    .mutation(async ({ input }) => {
      const store = await getStoreById(input.id);
      if (!store) throw new TRPCError({ code: "NOT_FOUND" });
      await approveStore(input.id, input.adminNote);
      return { success: true };
    }),

  adminRejectStore: adminProcedure
    .input(z.object({ id: z.number(), adminNote: z.string() }))
    .mutation(async ({ input }) => {
      await rejectStore(input.id, input.adminNote);
      return { success: true };
    }),

  adminSuspendStore: adminProcedure
    .input(z.object({ id: z.number(), adminNote: z.string() }))
    .mutation(async ({ input }) => {
      await suspendStore(input.id, input.adminNote);
      return { success: true };
    }),

  adminReinstateStore: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await reinstateStore(input.id);
      return { success: true };
    }),

  adminStats: adminProcedure.query(() => getMarketplaceAdminStats()),

  // Admin: deposit management
  adminListDeposits: adminProcedure
    .input(z.object({ status: z.string().optional(), page: z.number().default(1), limit: z.number().default(20) }))
    .query(({ input }) => listDepositsAdmin(input)),

  adminConfirmDeposit: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await confirmDeposit(input.id);
      return { success: true };
    }),

  adminRefundDeposit: adminProcedure
    .input(z.object({ id: z.number(), adminNote: z.string().optional() }))
    .mutation(async ({ input }) => {
      await refundDeposit(input.id, input.adminNote);
      return { success: true };
    }),

  // Admin: platform config
  adminGetConfig: adminProcedure.query(() => getAllPlatformConfig()),

  adminSetConfig: adminProcedure
    .input(z.object({ key: z.string(), value: z.string(), description: z.string().optional() }))
    .mutation(async ({ input }) => {
      await setPlatformConfig(input.key, input.value, input.description);
      return { success: true };
    }),
});
