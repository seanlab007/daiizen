import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc.ts";
import { TRPCError } from "@trpc/server";
import {
  getOrCreateReferralCode, getReferralCodeByCode, applyReferralCode,
  getReferralRelation, triggerReferralRewards, getUserRewards,
  confirmReferralReward, listPendingRewards, getUserCredits,
  getOrCreateStoreProfile, updateStoreProfile,
  listSupplyChainProducts, getSupplyChainProduct, createSupplyChainProduct,
  getStoreSupplyChainProducts, createDropshipLink, getDropshipLinkByProduct,
  getSupplyChainPendingOrders, updateDropshipOrderStatus,
  getInfluencerDropshipOrders, getReferralTree,
} from "../db-s2b2c.ts";
import { getStoreByUserId, createStoreProduct } from "../db-store.ts";
import { invokeLLM } from "../_core/llm.ts";

// ─── Admin guard ──────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
  return next({ ctx });
});

export const s2b2cRouter = router({

  // ─── Referral Code ──────────────────────────────────────────────────────────

  getMyReferralCode: protectedProcedure.query(async ({ ctx }) => {
    return getOrCreateReferralCode(ctx.user.id);
  }),

  applyReferralCode: protectedProcedure
    .input(z.object({ code: z.string().min(6).max(16) }))
    .mutation(async ({ ctx, input }) => {
      const result = await applyReferralCode(ctx.user.id, input.code);
      if (!result) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid code or already referred" });
      return result;
    }),

  getMyReferralRelation: protectedProcedure.query(async ({ ctx }) => {
    return getReferralRelation(ctx.user.id);
  }),

  getMyReferralTree: protectedProcedure.query(async ({ ctx }) => {
    return getReferralTree(ctx.user.id);
  }),

  getMyRewards: protectedProcedure
    .input(z.object({ page: z.number().default(1), limit: z.number().default(20) }).optional())
    .query(async ({ ctx, input }) => {
      return getUserRewards(ctx.user.id, input ?? {});
    }),

  getMyCredits: protectedProcedure.query(async ({ ctx }) => {
    return getUserCredits(ctx.user.id);
  }),

  // ─── Store Profile (type: influencer / supply_chain / brand) ───────────────

  getMyStoreProfile: protectedProcedure.query(async ({ ctx }) => {
    const store = await getStoreByUserId(ctx.user.id);
    if (!store) throw new TRPCError({ code: "NOT_FOUND", message: "No store found" });
    return getOrCreateStoreProfile(store.id);
  }),

  updateMyStoreProfile: protectedProcedure
    .input(z.object({
      storeType: z.enum(["influencer", "supply_chain", "brand"]).optional(),
      tiktokHandle: z.string().max(128).optional(),
      instagramHandle: z.string().max(128).optional(),
      youtubeHandle: z.string().max(128).optional(),
      xiaohongshuHandle: z.string().max(128).optional(),
      followerCount: z.number().int().min(0).optional(),
      minOrderQuantity: z.number().int().min(1).optional(),
      warehouseCountry: z.string().max(64).optional(),
      shippingDays: z.number().int().min(1).optional(),
      isDropshipEnabled: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const store = await getStoreByUserId(ctx.user.id);
      if (!store) throw new TRPCError({ code: "NOT_FOUND", message: "No store found" });
      const data: any = { ...input };
      if (input.isDropshipEnabled !== undefined) data.isDropshipEnabled = input.isDropshipEnabled ? 1 : 0;
      await updateStoreProfile(store.id, data);
      return { success: true };
    }),

  // ─── Supply Chain Products ──────────────────────────────────────────────────

  listSupplyChainCatalog: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      categoryId: z.number().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      return listSupplyChainProducts(input);
    }),

  getSupplyChainProduct: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const product = await getSupplyChainProduct(input.id);
      if (!product) throw new TRPCError({ code: "NOT_FOUND" });
      return product;
    }),

  addSupplyChainProduct: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(256),
      description: z.string().optional(),
      categoryId: z.number().optional(),
      basePriceUsdd: z.string(),
      suggestedRetailPriceUsdd: z.string().optional(),
      images: z.array(z.string()).optional(),
      stock: z.number().int().min(0).default(0),
      minOrderQty: z.number().int().min(1).default(1),
      weight: z.string().optional(),
      tags: z.array(z.string()).optional(),
      isDropshipAvailable: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const store = await getStoreByUserId(ctx.user.id);
      if (!store || store.status !== "active") throw new TRPCError({ code: "FORBIDDEN", message: "Active store required" });
      const profile = await getOrCreateStoreProfile(store.id);
      if (profile.storeType !== "supply_chain") throw new TRPCError({ code: "FORBIDDEN", message: "Supply chain store required" });
      return createSupplyChainProduct({
        storeId: store.id,
        name: input.name,
        description: input.description,
        categoryId: input.categoryId,
        basePriceUsdd: input.basePriceUsdd,
        suggestedRetailPriceUsdd: input.suggestedRetailPriceUsdd,
        images: input.images,
        stock: input.stock,
        minOrderQty: input.minOrderQty,
        weight: input.weight,
        tags: input.tags,
        isDropshipAvailable: input.isDropshipAvailable ? 1 : 0,
      });
    }),

  getMySupplyChainProducts: protectedProcedure
    .input(z.object({ page: z.number().default(1), limit: z.number().default(20) }).optional())
    .query(async ({ ctx, input }) => {
      const store = await getStoreByUserId(ctx.user.id);
      if (!store) throw new TRPCError({ code: "NOT_FOUND" });
      return getStoreSupplyChainProducts(store.id, input ?? {});
    }),

  // ─── Influencer: Select supply chain product to sell (dropship) ─────────────

  addDropshipProduct: protectedProcedure
    .input(z.object({
      supplyChainProductId: z.number(),
      markupPriceUsdd: z.string(), // influencer's selling price
    }))
    .mutation(async ({ ctx, input }) => {
      const store = await getStoreByUserId(ctx.user.id);
      if (!store || store.status !== "active") throw new TRPCError({ code: "FORBIDDEN", message: "Active store required" });
      const profile = await getOrCreateStoreProfile(store.id);
      if (profile.storeType !== "influencer") throw new TRPCError({ code: "FORBIDDEN", message: "Influencer store required" });

      const scProduct = await getSupplyChainProduct(input.supplyChainProductId);
      if (!scProduct || !scProduct.isDropshipAvailable) throw new TRPCError({ code: "NOT_FOUND", message: "Product not available for dropship" });

      const markup = parseFloat(input.markupPriceUsdd);
      const base = parseFloat(scProduct.basePriceUsdd);
      if (markup <= base) throw new TRPCError({ code: "BAD_REQUEST", message: "Markup price must be higher than base price" });

      // Create a storeProduct for the influencer
      const slug = `${store.slug}-${scProduct.id}-${Date.now()}`;
      const storeProduct = await createStoreProduct({
        storeId: store.id,
        name: scProduct.name,
        description: scProduct.description,
        categoryId: scProduct.categoryId,
        slug,
        priceUsdd: input.markupPriceUsdd,
        originalPriceUsdd: scProduct.suggestedRetailPriceUsdd,
        stock: scProduct.stock,
        images: scProduct.images,
        tags: scProduct.tags,
        weight: scProduct.weight,
      });

      // Create dropship link
      await createDropshipLink({
        influencerStoreId: store.id,
        influencerProductId: storeProduct.id,
        supplyChainProductId: scProduct.id,
        supplyChainStoreId: scProduct.storeId,
        markupPriceUsdd: input.markupPriceUsdd,
        basePriceUsdd: scProduct.basePriceUsdd,
        influencerMarginUsdd: (markup - base).toFixed(6),
      });

      return { success: true, storeProduct };
    }),

  // ─── AI Product Selection Tool ──────────────────────────────────────────────

  aiSelectProducts: protectedProcedure
    .input(z.object({
      niche: z.string().max(200),
      audience: z.string().max(200).optional(),
      budget: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const products = await listSupplyChainProducts({ limit: 50 });
      const productList = products.products.map(p =>
        `ID:${p.product.id} | ${p.product.name} | Base:$${p.product.basePriceUsdd} | SRP:$${p.product.suggestedRetailPriceUsdd ?? "N/A"} | Sales:${p.product.salesCount}`
      ).join("\n");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert e-commerce product selection advisor for influencers. 
Analyze the available supply chain products and recommend the best ones for the influencer's niche.
Return a JSON array of recommended product IDs with reasoning.`,
          },
          {
            role: "user",
            content: `My niche: ${input.niche}
Target audience: ${input.audience ?? "general"}
Budget range: ${input.budget ?? "any"}

Available products:
${productList}

Please recommend 5-8 products with the highest potential for my niche. Return JSON: {"recommendations": [{"id": number, "name": string, "reason": string, "suggestedMarkup": string}]}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "product_recommendations",
            strict: true,
            schema: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "number" },
                      name: { type: "string" },
                      reason: { type: "string" },
                      suggestedMarkup: { type: "string" },
                    },
                    required: ["id", "name", "reason", "suggestedMarkup"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["recommendations"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response.choices?.[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : null;
      if (!content) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI failed to respond" });
      return JSON.parse(content) as { recommendations: { id: number; name: string; reason: string; suggestedMarkup: string }[] };
    }),

  // ─── Supply Chain: Order Fulfillment ────────────────────────────────────────

  getMyDropshipOrders: protectedProcedure
    .input(z.object({ page: z.number().default(1), limit: z.number().default(20) }).optional())
    .query(async ({ ctx, input }) => {
      const store = await getStoreByUserId(ctx.user.id);
      if (!store) throw new TRPCError({ code: "NOT_FOUND" });
      const profile = await getOrCreateStoreProfile(store.id);
      if (profile.storeType === "supply_chain") {
        return getSupplyChainPendingOrders(store.id, input ?? {});
      }
      return getInfluencerDropshipOrders(store.id, input ?? {});
    }),

  fulfillDropshipOrder: protectedProcedure
    .input(z.object({
      dropshipOrderId: z.number(),
      status: z.enum(["accepted", "shipped", "cancelled"]),
      trackingNumber: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const store = await getStoreByUserId(ctx.user.id);
      if (!store) throw new TRPCError({ code: "NOT_FOUND" });
      await updateDropshipOrderStatus(input.dropshipOrderId, input.status, input.trackingNumber);
      return { success: true };
    }),

  // ─── Admin: Referral Rewards ─────────────────────────────────────────────────

  adminListPendingRewards: adminProcedure
    .input(z.object({ page: z.number().default(1), limit: z.number().default(50) }).optional())
    .query(async ({ input }) => {
      return listPendingRewards(input ?? {});
    }),

  adminConfirmReward: adminProcedure
    .input(z.object({ rewardId: z.number() }))
    .mutation(async ({ input }) => {
      await confirmReferralReward(input.rewardId);
      return { success: true };
    }),
});
