import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import {
  createWithdrawalRequest,
  getWithdrawalsByStore,
  getAllWithdrawalRequests,
  approveWithdrawal,
  rejectWithdrawal,
  markWithdrawalPaid,
} from "../db";
import { notifyOwner } from "../_core/notification";
import { getDb } from "../db";
import { eq } from "drizzle-orm";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

export const withdrawalRouter = router({
  // Seller: request a withdrawal
  requestWithdrawal: protectedProcedure
    .input(z.object({
      storeId: z.number(),
      amountUsdd: z.string().regex(/^\d+(\.\d{1,6})?$/, "Invalid amount"),
      walletAddress: z.string().min(30).max(64, "Invalid TRC-20 wallet address"),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns this store
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { stores } = await import("../../drizzle/schema");
      const [store] = await db.select().from(stores)
        .where(eq(stores.id, input.storeId))
        .limit(1);
      if (!store || store.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your store" });
      }
      const req = await createWithdrawalRequest({
        storeId: input.storeId,
        userId: ctx.user.id,
        amountUsdd: input.amountUsdd,
        walletAddress: input.walletAddress,
      });
      await notifyOwner({
        title: `💸 New Withdrawal Request`,
        content: `Store "${store.name}" requested withdrawal of ${input.amountUsdd} USDD to ${input.walletAddress}. Request ID: ${req.id}`,
      }).catch(() => {});
      return req;
    }),

  // Seller: get withdrawal history for their store
  getMyWithdrawals: protectedProcedure
    .input(z.object({ storeId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const { stores } = await import("../../drizzle/schema");
      const [store] = await db.select().from(stores)
        .where(eq(stores.id, input.storeId))
        .limit(1);
      if (!store || store.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getWithdrawalsByStore(input.storeId);
    }),

  // Admin: get all withdrawal requests
  adminGetAll: adminProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(async ({ input }) => {
      return getAllWithdrawalRequests(input.status);
    }),

  // Admin: approve a withdrawal
  adminApprove: adminProcedure
    .input(z.object({ id: z.number(), adminNote: z.string().optional() }))
    .mutation(async ({ input }) => {
      return approveWithdrawal(input.id, input.adminNote);
    }),

  // Admin: reject a withdrawal (refunds balance to store)
  adminReject: adminProcedure
    .input(z.object({ id: z.number(), rejectionReason: z.string() }))
    .mutation(async ({ input }) => {
      return rejectWithdrawal(input.id, input.rejectionReason);
    }),

  // Admin: mark as paid (enter TRC-20 txHash)
  adminMarkPaid: adminProcedure
    .input(z.object({ id: z.number(), txHash: z.string(), adminNote: z.string().optional() }))
    .mutation(async ({ input }) => {
      return markWithdrawalPaid(input.id, input.txHash, input.adminNote);
    }),
});
