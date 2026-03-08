import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import {
  getOrCreateUsddWallet,
  getUserUsddTransactions,
  createUsddDeposit,
  confirmUsddDeposit,
  rejectUsddDeposit,
  getAllPendingUsddDeposits,
} from "../db";
import { storagePut } from "../storage";
import { notifyOwner } from "../_core/notification";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

export const walletRouter = router({
  // Get current user's USDD wallet balance and info
  getMyWallet: protectedProcedure.query(async ({ ctx }) => {
    return getOrCreateUsddWallet(ctx.user.id);
  }),

  // Get current user's transaction history
  getMyTransactions: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      return getUserUsddTransactions(ctx.user.id, input.limit, input.offset);
    }),

  // Submit a deposit request (user uploads screenshot, admin confirms)
  submitDeposit: protectedProcedure
    .input(z.object({
      amountUsdd: z.string().regex(/^\d+(\.\d{1,6})?$/, "Invalid amount"),
      depositScreenshotUrl: z.string().url().optional(),
      txHash: z.string().optional(),
      note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const amount = parseFloat(input.amountUsdd);
      if (amount < 1) throw new TRPCError({ code: "BAD_REQUEST", message: "Minimum deposit is 1 USDD" });
      const tx = await createUsddDeposit(ctx.user.id, input);
      // Notify admin
      await notifyOwner({
        title: `💰 New USDD Deposit Request`,
        content: `User ${ctx.user.name ?? ctx.user.email ?? ctx.user.id} submitted a deposit of ${amount} USDD. TX ID: ${tx.id}`,
      }).catch(() => {});
      return tx;
    }),

  // Upload deposit screenshot to S3 and return URL
  uploadDepositScreenshot: protectedProcedure
    .input(z.object({
      base64: z.string(),
      mimeType: z.string().default("image/jpeg"),
    }))
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      if (buffer.length > 5 * 1024 * 1024) throw new TRPCError({ code: "BAD_REQUEST", message: "File too large (max 5MB)" });
      const ext = input.mimeType.includes("png") ? "png" : "jpg";
      const key = `deposits/${ctx.user.id}-${Date.now()}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { url };
    }),

  // Admin: get all pending deposit requests
  adminGetPendingDeposits: adminProcedure.query(async () => {
    return getAllPendingUsddDeposits();
  }),

  // Admin: confirm a deposit
  adminConfirmDeposit: adminProcedure
    .input(z.object({ txId: z.number(), adminNote: z.string().optional() }))
    .mutation(async ({ input }) => {
      return confirmUsddDeposit(input.txId, input.adminNote);
    }),

  // Admin: reject a deposit
  adminRejectDeposit: adminProcedure
    .input(z.object({ txId: z.number(), adminNote: z.string() }))
    .mutation(async ({ input }) => {
      return rejectUsddDeposit(input.txId, input.adminNote);
    }),
});
