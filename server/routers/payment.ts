import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getPaymentConfigs,
  getPaymentConfigByMethod,
  upsertPaymentConfig,
  updateDepositPaymentInfo,
  adminReviewDeposit,
  listPendingDepositsWithPayment,
  trackProductEvent,
  getStoreAnalytics,
  getPlatformAnalytics,
} from "../db-payment";
import { getStoreByUserId } from "../db-store";
import { storagePut } from "../storage";

// ─── Admin guard ─────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
  }
  return next({ ctx });
});

export const paymentRouter = router({
  // ── Public: get enabled payment methods (for deposit flow) ──────────────────
  getPaymentMethods: publicProcedure.query(async () => {
    const configs = await getPaymentConfigs();
    return configs;
  }),

  // ── Seller: submit deposit with payment method + screenshot ─────────────────
  submitDepositPayment: protectedProcedure
    .input(
      z.object({
        depositId: z.number().int().positive(),
        paymentMethod: z.enum(["usdd", "alipay", "wechat", "unionpay"]),
        paymentAmountCny: z.number().positive().optional(),
        transferScreenshotUrl: z.string().url().optional(),
        transferNote: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await updateDepositPaymentInfo(input.depositId, {
        paymentMethod: input.paymentMethod,
        paymentAmountCny: input.paymentAmountCny,
        transferScreenshotUrl: input.transferScreenshotUrl,
        transferNote: input.transferNote,
      });
      return { success: true };
    }),

  // ── Admin: list pending deposits for review ──────────────────────────────────
  adminListPendingDeposits: adminProcedure
    .input(z.object({ page: z.number().int().min(1).default(1) }))
    .query(async ({ input }) => {
      return listPendingDepositsWithPayment(input.page, 20);
    }),

  // ── Admin: confirm or reject a deposit ──────────────────────────────────────
  adminReviewDeposit: adminProcedure
    .input(
      z.object({
        depositId: z.number().int().positive(),
        action: z.enum(["confirm", "reject"]),
        reviewNote: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input }) => {
      await adminReviewDeposit(input.depositId, input.action, input.reviewNote);
      return { success: true };
    }),

  // ── Admin: get/update payment config (QR code, account info) ────────────────
  adminGetPaymentConfigs: adminProcedure.query(async () => {
    const configs = await getPaymentConfigs();
    return configs;
  }),

  adminUpdatePaymentConfig: adminProcedure
    .input(
      z.object({
        method: z.enum(["alipay", "wechat", "unionpay"]),
        accountName: z.string().max(100).optional(),
        accountNumber: z.string().max(100).optional(),
        qrCodeUrl: z.string().url().nullable().optional(),
        isEnabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await upsertPaymentConfig(input.method, {
        accountName: input.accountName,
        accountNumber: input.accountNumber,
        qrCodeUrl: input.qrCodeUrl,
        isEnabled: input.isEnabled,
      });
      return { success: true };
    }),

  // ── Analytics: track a product event ────────────────────────────────────────
  trackEvent: publicProcedure
    .input(
      z.object({
        storeProductId: z.number().int().positive(),
        eventType: z.enum(["view", "cart_add", "order"]),
        amountUsdd: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await trackProductEvent({
        storeProductId: input.storeProductId,
        eventType: input.eventType,
        userId: (ctx as any).user?.id,
        amountUsdd: input.amountUsdd,
      });
      return { success: true };
    }),

  // ── Seller: get store analytics ──────────────────────────────────────────────
  getMyStoreAnalytics: protectedProcedure.query(async ({ ctx }) => {
    const store = await getStoreByUserId(ctx.user.id);
    if (!store) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Store not found" });
    }
    return getStoreAnalytics(store.id);
  }),

  // ── Admin: platform-wide analytics ──────────────────────────────────────────
  adminGetPlatformAnalytics: adminProcedure.query(async () => {
    return getPlatformAnalytics();
  }),
});
