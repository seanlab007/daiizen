import { storeRouter } from "./routers/store";
import { walletRouter } from "./routers/wallet";
import { paymentRouter } from "./routers/payment";
import { s2b2cRouter } from "./routers/s2b2c";
import { reviewsRouter } from "./routers/reviews";
import { notificationsRouter } from "./routers/notifications";
import { bulkImportRouter } from "./routers/bulkImport";
import { withdrawalRouter } from "./routers/withdrawal";
import { getDb } from "./db";
import { eq as eqDrizzle } from "drizzle-orm";
import { creatorCards, creatorCardConsumptions, groupBuys as groupBuysTable } from "../drizzle/schema";
import { createGroupBuy, processExpiredGroupBuys, getActiveGroupBuys, getGroupBuyByToken, joinGroupBuy } from "./groupBuy";
import { reviewCreatorCard, generateCardNumber } from "./creatorCardAI";
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

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(() => {
      // Logout handled client-side via Supabase Auth
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
  groupBuy: router({
    list: publicProcedure.query(() => getActiveGroupBuys()),
    getByToken: publicProcedure
      .input(z.object({ shareToken: z.string(), origin: z.string().optional() }))
      .query(({ input }) => getGroupBuyByToken(input.shareToken, input.origin)),
    create: protectedProcedure
      .input(z.object({
        productId: z.number().optional(),
        productName: z.string(),
        productSlug: z.string().optional(),
        originalPrice: z.number(),
        groupType: z.enum(["standard", "flash", "万人团"]).default("standard"),
        imageUrl: z.string().optional(),
        quantity: z.number().default(1),
      }))
      .mutation(({ ctx, input }) => createGroupBuy({ ...input, creatorId: ctx.user.id })),
    join: protectedProcedure
      .input(z.object({
        shareToken: z.string(),
        quantity: z.number().default(1),
        joinedVia: z.string().optional(),
        addressId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [group] = await db.select().from(groupBuysTable).where(eqDrizzle(groupBuysTable.shareToken, input.shareToken));
        if (!group) throw new TRPCError({ code: "NOT_FOUND", message: "Group buy not found" });
        return joinGroupBuy({ groupBuyId: group.id, userId: ctx.user.id, quantity: input.quantity, joinedVia: input.joinedVia });
      }),
    processExpired: publicProcedure.mutation(() => processExpiredGroupBuys()),
  }),
  creatorCard: router({
    getMyCard: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const [card] = await db.select().from(creatorCards).where(eqDrizzle(creatorCards.userId, ctx.user.id));
      return card ?? null;
    }),
    applyCard: protectedProcedure
      .input(z.object({
        socialAccounts: z.array(z.object({
          platform: z.string(),
          handle: z.string(),
          followers: z.number(),
          url: z.string().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [existing] = await db.select().from(creatorCards).where(eqDrizzle(creatorCards.userId, ctx.user.id));
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "You already have a Creator Card application" });
        const review = await reviewCreatorCard(input.socialAccounts);
        const cardNumber = generateCardNumber();
        const expiresAt = new Date(Date.now() + 365 * 24 * 3600 * 1000);
        await db.insert(creatorCards).values({
          userId: ctx.user.id,
          cardNumber,
          cardColor: review.cardColor as any,
          creditLimit: review.creditLimit.toString(),
          usedAmount: "0",
          status: review.approved ? "active" : "rejected",
          totalFollowers: review.totalFollowers,
          aiScore: review.score,
          aiReason: review.reason,
          socialAccounts: input.socialAccounts,
          expiresAt: review.approved ? expiresAt : undefined,
        });
        return review;
      }),
    getConsumptions: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(creatorCardConsumptions).where(eqDrizzle(creatorCardConsumptions.userId, ctx.user.id));
    }),
    // Upload content screenshot to S3
    uploadContentScreenshot: protectedProcedure
      .input(z.object({ base64: z.string(), mimeType: z.string().default("image/jpeg") }))
      .mutation(async ({ ctx, input }) => {
        const { storagePut } = await import("./storage");
        const buffer = Buffer.from(input.base64, "base64");
        if (buffer.length > 5 * 1024 * 1024) throw new TRPCError({ code: "BAD_REQUEST", message: "File too large (max 5MB)" });
        const ext = input.mimeType.includes("png") ? "png" : "jpg";
        const key = `creator-content/${ctx.user.id}-${Date.now()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),
    // Submit content for repayment on an existing consumption record
    submitContent: protectedProcedure
      .input(z.object({
        consumptionId: z.number(),
        submissionType: z.enum(["wechat_moments", "community_trade", "social_media", "referral_signup"]),
        contentUrl: z.string().optional(),
        screenshotUrl: z.string().optional(),
        contentDescription: z.string().optional(),
        claimedViews: z.number().optional(),
        platform: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [consumption] = await db.select().from(creatorCardConsumptions)
          .where(eqDrizzle(creatorCardConsumptions.id, input.consumptionId));
        if (!consumption) throw new TRPCError({ code: "NOT_FOUND", message: "Consumption record not found" });
        if (consumption.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        if (consumption.repaymentStatus !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Content already submitted for this record" });
        const { reviewSocialDistribution } = await import("./socialDistributionAI");
        const review = await reviewSocialDistribution({
          submissionType: input.submissionType,
          platform: input.platform,
          contentUrl: input.contentUrl,
          screenshotUrl: input.screenshotUrl,
          description: input.contentDescription,
          claimedViews: input.claimedViews,
        });
        await db.update(creatorCardConsumptions)
          .set({
            repaymentStatus: review.approved ? "submitted" : "rejected",
            submissionType: input.submissionType,
            contentUrl: input.contentUrl ?? null,
            screenshotUrl: input.screenshotUrl ?? null,
            contentDescription: input.contentDescription ?? null,
            claimedViews: input.claimedViews ?? null,
            aiReviewScore: review.score,
            aiReviewReason: review.reason,
            darkRewardEarned: review.darkReward.toString(),
            updatedAt: new Date(),
          })
          .where(eqDrizzle(creatorCardConsumptions.id, input.consumptionId));
        return review;
      }),
    // Admin: list all creator card applications
    adminListCards: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(creatorCards);
    }),
    // Admin: update card status / credit limit
    adminUpdateCard: adminProcedure
      .input(z.object({
        cardId: z.number(),
        status: z.enum(["pending", "active", "suspended", "rejected"]).optional(),
        creditLimit: z.string().optional(),
        adminNote: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const updates: Record<string, unknown> = { updatedAt: new Date() };
        if (input.status) updates.status = input.status;
        if (input.creditLimit) updates.creditLimit = input.creditLimit;
        await db.update(creatorCards).set(updates as any).where(eqDrizzle(creatorCards.id, input.cardId));
        return { success: true };
      }),
    // Admin: list all content repayment submissions
    adminListSubmissions: adminProcedure
      .input(z.object({ status: z.string().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const rows = await db.select().from(creatorCardConsumptions);
        if (input.status) return rows.filter((r: typeof creatorCardConsumptions.$inferSelect) => r.repaymentStatus === input.status);
        return rows;
      }),
    // Admin: approve or reject a content submission
    adminReviewSubmission: adminProcedure
      .input(z.object({
        consumptionId: z.number(),
        approved: z.boolean(),
        adminNote: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(creatorCardConsumptions)
          .set({
            repaymentStatus: input.approved ? "approved" : "rejected",
            aiReviewReason: input.adminNote ?? undefined,
            updatedAt: new Date(),
          } as any)
          .where(eqDrizzle(creatorCardConsumptions.id, input.consumptionId));
        return { success: true };
      }),
  }),
  quotes: router({
    // Public: submit a bulk quote request
    submit: publicProcedure
      .input(z.object({
        orgName: z.string().min(2).max(256),
        contactName: z.string().min(2).max(128),
        contactEmail: z.string().email(),
        contactPhone: z.string().optional(),
        orgType: z.enum(["ngo", "military", "government", "medical", "other"]),
        deliveryCountry: z.string().min(2).max(64),
        deliveryCity: z.string().optional(),
        deliveryAddress: z.string().optional(),
        items: z.array(z.object({
          productId: z.number(),
          productName: z.string(),
          quantity: z.number().min(1),
          unitPriceUsdd: z.string(),
        })).min(1),
        urgency: z.enum(["standard", "urgent", "critical"]).default("standard"),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await createQuoteRequest({
          ...input,
          userId: ctx.user?.id,
        });
        // Notify admin
        const urgencyLabel = input.urgency === "critical" ? "🚨 CRITICAL" : input.urgency === "urgent" ? "⚡ URGENT" : "📋 Standard";
        const itemsSummary = input.items.map(i => `${i.productName} × ${i.quantity}`).join(", ");
        const total = input.items.reduce((s, i) => s + parseFloat(i.unitPriceUsdd) * i.quantity, 0);
        await notifyOwner({
          title: `${urgencyLabel} Bulk Quote Request from ${input.orgName}`,
          content: `Organization: ${input.orgName} (${input.orgType})\nContact: ${input.contactName} <${input.contactEmail}>${input.contactPhone ? " | " + input.contactPhone : ""}\nDelivery: ${input.deliveryCountry}${input.deliveryCity ? ", " + input.deliveryCity : ""}\nItems: ${itemsSummary}\nEstimated Total: ${total.toFixed(2)} USDD\n${input.notes ? "Notes: " + input.notes : ""}\n\nReview in Admin → Quotes tab.`,
        });
        return { id };
      }),

    // Admin: list all quote requests
    list: adminProcedure
      .input(z.object({ status: z.string().optional() }))
      .query(({ input }) => listQuoteRequests(input.status)),

    // Admin: update quote status
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "reviewed", "quoted", "accepted", "rejected"]),
        adminNotes: z.string().optional(),
        quotedPriceUsdd: z.string().optional(),
      }))
      .mutation(({ input }) => updateQuoteStatus(input.id, input.status, input.adminNotes, input.quotedPriceUsdd)),
  }),
  // ─── Business Routers ────────────────────────────────────────────────────────
  store: storeRouter,
  wallet: walletRouter,
  payment: paymentRouter,
  s2b2c: s2b2cRouter,
  reviews: reviewsRouter,
  notifications: notificationsRouter,
  bulkImport: bulkImportRouter,
  withdrawal: withdrawalRouter,
});

// Import additional db functions needed for groupBuy, creatorCard, quotes
import { createCategory, createQuoteRequest, listQuoteRequests, updateQuoteStatus, upsertBulkDiscount, deleteBulkDiscount, getAllLowStockThresholds, setLowStockThreshold, checkAndNotifyLowStock } from "./db";

export type AppRouter = typeof appRouter;
