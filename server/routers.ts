import { COOKIE_NAME } from "@shared/const";
import { storeRouter } from "./routers/store";
import { s2b2cRouter } from "./routers/s2b2c";
import { paymentRouter } from "./routers/payment";
import { bulkImportRouter } from "./routers/bulkImport";
import { walletRouter } from "./routers/wallet";
import { withdrawalRouter } from "./routers/withdrawal";
import { reviewsRouter } from "./routers/reviews";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getProducts,
  getFeaturedProducts,
  getProductBySlug,
  getCategories,
  getCartItems,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount,
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getExchangeRates,
  upsertExchangeRate,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminStats,
  saveChatMessage,
  getChatHistory,
  getAllOrders,
  creditSellerEarningsForOrder,
  processReferralRewardsForOrder,
} from "./db";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { generateImage } from "./_core/imageGeneration";

// Admin guard
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  store: storeRouter,
  s2b2c: s2b2cRouter,
  payment: paymentRouter,
  bulkImport: bulkImportRouter,
  wallet: walletRouter,
  withdrawal: withdrawalRouter,
  reviews: reviewsRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Products ──────────────────────────────────────────────────────────────
  products: router({
    list: publicProcedure
      .input(
        z.object({
          categorySlug: z.string().optional(),
          search: z.string().optional(),
          sort: z.enum(["newest", "price_asc", "price_desc"]).optional(),
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(50).default(20),
        })
      )
      .query(({ input }) => getProducts(input)),

    featured: publicProcedure
      .input(z.object({ limit: z.number().default(8) }))
      .query(({ input }) => getFeaturedProducts(input.limit)),

    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const product = await getProductBySlug(input.slug);
        if (!product) throw new TRPCError({ code: "NOT_FOUND" });
        return product;
      }),
  }),

  // ─── Categories ────────────────────────────────────────────────────────────
  categories: router({
    list: publicProcedure.query(() => getCategories()),
  }),

  // ─── Cart ──────────────────────────────────────────────────────────────────
  cart: router({
    list: protectedProcedure.query(({ ctx }) => getCartItems(ctx.user.id)),
    count: protectedProcedure.query(async ({ ctx }) => {
      const count = await getCartCount(ctx.user.id);
      return { count };
    }),
    add: protectedProcedure
      .input(z.object({ productId: z.number(), quantity: z.number().min(1).default(1) }))
      .mutation(({ ctx, input }) => addToCart(ctx.user.id, input.productId, input.quantity)),
    update: protectedProcedure
      .input(z.object({ cartItemId: z.number(), quantity: z.number().min(0) }))
      .mutation(({ ctx, input }) => updateCartItem(ctx.user.id, input.cartItemId, input.quantity)),
    remove: protectedProcedure
      .input(z.object({ cartItemId: z.number() }))
      .mutation(({ ctx, input }) => removeFromCart(ctx.user.id, input.cartItemId)),
    clear: protectedProcedure.mutation(({ ctx }) => clearCart(ctx.user.id)),
  }),

  // ─── Orders ────────────────────────────────────────────────────────────────
  orders: router({
    list: protectedProcedure.query(({ ctx }) => getOrders(ctx.user.id)),
    byId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const order = await getOrderById(input.id, ctx.user.id);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        return order;
      }),
    create: protectedProcedure
      .input(
        z.object({
          addressId: z.number(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const order = await createOrder(ctx.user.id, input.addressId, input.notes);
        // Notify owner of new order
        await notifyOwner({
          title: `New Order #${order.orderNumber}`,
          content: `User ${ctx.user.name || ctx.user.email} placed order #${order.orderNumber} for ${order.totalUsdd} USDD`,
        }).catch(() => {});
        return order;
      }),
    confirmPayment: protectedProcedure
      .input(z.object({ orderId: z.number(), txHash: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const order = await updateOrderStatus(input.orderId, "paid", input.txHash, ctx.user.id);
        await notifyOwner({
          title: `Payment Confirmed: Order #${order.orderNumber}`,
          content: `Order #${order.orderNumber} payment confirmed. TX: ${input.txHash || "manual"}`,
        }).catch(() => {});
        return order;
      }),
  }),

  // ─── Addresses ─────────────────────────────────────────────────────────────
  addresses: router({
    list: protectedProcedure.query(({ ctx }) => getAddresses(ctx.user.id)),
    create: protectedProcedure
      .input(
        z.object({
          fullName: z.string().min(1),
          phone: z.string().optional(),
          country: z.string().min(1),
          state: z.string().optional(),
          city: z.string().min(1),
          addressLine1: z.string().min(1),
          addressLine2: z.string().optional(),
          postalCode: z.string().optional(),
          isDefault: z.boolean().default(false),
        })
      )
      .mutation(({ ctx, input }) => createAddress(ctx.user.id, input)),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          fullName: z.string().min(1),
          phone: z.string().optional(),
          country: z.string().min(1),
          state: z.string().optional(),
          city: z.string().min(1),
          addressLine1: z.string().min(1),
          addressLine2: z.string().optional(),
          postalCode: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) => updateAddress(ctx.user.id, input)),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => deleteAddress(ctx.user.id, input.id)),
    setDefault: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => setDefaultAddress(ctx.user.id, input.id)),
  }),

  // ─── Exchange Rates ────────────────────────────────────────────────────────
  exchangeRates: router({
    list: publicProcedure.query(() => getExchangeRates()),
    refresh: adminProcedure.mutation(async () => {
      // Fetch live rates from a free API
      try {
        const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        const data = await res.json() as { rates: Record<string, number> };
        const targets = ["ARS", "TRY", "VES", "BRL", "ZAR", "NGN", "EGP", "PKR", "IRR", "LBP"];
        for (const currency of targets) {
          if (data.rates[currency]) {
            await upsertExchangeRate("USDD", currency, data.rates[currency]);
          }
        }
        return { success: true };
      } catch {
        return { success: false };
      }
    }),
  }),

  // ─── AI Customer Service ───────────────────────────────────────────────────
  chat: router({
    history: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(({ input }) => getChatHistory(input.sessionId)),

    send: publicProcedure
      .input(
        z.object({
          sessionId: z.string(),
          message: z.string().min(1).max(1000),
          language: z.string().default("en"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Save user message
        await saveChatMessage({
          userId: ctx.user?.id,
          sessionId: input.sessionId,
          role: "user",
          content: input.message,
          language: input.language,
        });

        // Get recent history for context
        const history = await getChatHistory(input.sessionId);
        const recentHistory = history.slice(-10);

        const systemPrompt = `You are a helpful customer service assistant for Daiizen, a global e-commerce platform selling everyday goods from China (Yiwu). 
We accept USDD stablecoin payments (powered by Dark Matter Bank). We ship worldwide, targeting customers in high-inflation countries.
Respond in the same language as the user's message. Be concise, friendly, and helpful.
Key facts: USDD is a stablecoin pegged to USD. Orders typically ship in 7-21 days. We sell daily essentials, kitchen items, stationery, clothing, electronics accessories, toys, beauty products, and sports items.`;

        const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          { role: "system", content: systemPrompt },
          ...recentHistory.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ];

        const response = await invokeLLM({ messages });
        const rawContent = response.choices?.[0]?.message?.content;
        const assistantContent = typeof rawContent === 'string' ? rawContent : "I'm sorry, I couldn't process your request.";

        // Save assistant response
        await saveChatMessage({
          userId: ctx.user?.id,
          sessionId: input.sessionId,
          role: "assistant",
          content: assistantContent,
          language: input.language,
        });

        return { content: assistantContent };
      }),
  }),

  // ─── Admin ─────────────────────────────────────────────────────────────────
  admin: router({
    stats: adminProcedure.query(() => getAdminStats()),

    orders: adminProcedure.query(() => getAllOrders()),

    updateOrderStatus: adminProcedure
      .input(
        z.object({
          orderId: z.number(),
          status: z.enum(["pending_payment", "paid", "shipped", "completed", "cancelled"]),
        })
      )
      .mutation(async ({ input }) => {
        const order = await updateOrderStatus(input.orderId, input.status);
        // Auto-settle seller earnings when order is completed
        if (input.status === "completed") {
          await creditSellerEarningsForOrder(input.orderId).catch(() => {});
          // Process referral rewards for the buyer
          await processReferralRewardsForOrder(input.orderId, order.userId).catch(() => {});
        }
        await notifyOwner({
          title: `Order Status Updated`,
          content: `Order #${order.orderNumber} status changed to ${input.status}`,
        }).catch(() => {});
        return order;
      }),

    createProduct: adminProcedure
      .input(
        z.object({
          categoryId: z.number().optional(),
          slug: z.string().min(1),
          nameEn: z.string().min(1),
          nameEs: z.string().optional(),
          nameTr: z.string().optional(),
          namePt: z.string().optional(),
          nameAr: z.string().optional(),
          nameRu: z.string().optional(),
          descriptionEn: z.string().optional(),
          priceUsdd: z.string(),
          stock: z.number().default(0),
          images: z.array(z.string()).default([]),
          isFeatured: z.boolean().default(false),
          isActive: z.boolean().default(true),
        })
      )
      .mutation(({ input }) => createProduct(input)),

    updateProduct: adminProcedure
      .input(
        z.object({
          id: z.number(),
          categoryId: z.number().optional(),
          nameEn: z.string().optional(),
          nameEs: z.string().optional(),
          nameTr: z.string().optional(),
          namePt: z.string().optional(),
          nameAr: z.string().optional(),
          nameRu: z.string().optional(),
          descriptionEn: z.string().optional(),
          priceUsdd: z.string().optional(),
          stock: z.number().optional(),
          images: z.array(z.string()).optional(),
          isFeatured: z.boolean().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(({ input }) => updateProduct(input)),

    deleteProduct: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteProduct(input.id)),

    generateProductImage: adminProcedure
      .input(
        z.object({
          productId: z.number(),
          productName: z.string(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const prompt = `Professional product photo of "${input.productName}" for an e-commerce store. ${input.description || ""} Clean white background, high quality, minimalist style.`;
        const { url } = await generateImage({ prompt });
        await updateProduct({ id: input.productId, images: [url] });
        return { url };
      }),

    createCategory: adminProcedure
      .input(
        z.object({
          slug: z.string().min(1),
          nameEn: z.string().min(1),
          nameEs: z.string().optional(),
          nameTr: z.string().optional(),
          namePt: z.string().optional(),
          nameAr: z.string().optional(),
          nameRu: z.string().optional(),
          sortOrder: z.number().default(0),
        })
      )
      .mutation(({ input }) => createCategory(input)),
  }),
});

// Import createCategory from db
import { createCategory } from "./db";

export type AppRouter = typeof appRouter;
