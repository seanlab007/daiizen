import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import {
  submitReview,
  getReviewsByProduct,
  getReviewsByStore,
  getMyReviews,
  getReviewableItems,
} from "../db";

export const reviewsRouter = router({
  // Submit a review for a completed order item
  submit: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        orderItemId: z.number(),
        productId: z.number().optional(),
        storeProductId: z.number().optional(),
        storeId: z.number().optional(),
        rating: z.number().min(1).max(5),
        comment: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await submitReview({
        orderId: input.orderId,
        orderItemId: input.orderItemId,
        userId: ctx.user.id,
        productId: input.productId ?? null,
        storeProductId: input.storeProductId ?? null,
        storeId: input.storeId ?? null,
        rating: input.rating,
        comment: input.comment ?? null,
      });
      return { success: true };
    }),

  // Get reviews for a specific store product
  getByProduct: publicProcedure
    .input(z.object({ storeProductId: z.number() }))
    .query(async ({ input }) => {
      return getReviewsByProduct(input.storeProductId);
    }),

  // Get reviews for a specific store
  getByStore: publicProcedure
    .input(z.object({ storeId: z.number() }))
    .query(async ({ input }) => {
      return getReviewsByStore(input.storeId);
    }),

  // Get all reviews written by the current user
  getMyReviews: protectedProcedure.query(async ({ ctx }) => {
    return getMyReviews(ctx.user.id);
  }),

  // Get order items from completed orders that haven't been reviewed yet
  getReviewableItems: protectedProcedure.query(async ({ ctx }) => {
    return getReviewableItems(ctx.user.id);
  }),
});
