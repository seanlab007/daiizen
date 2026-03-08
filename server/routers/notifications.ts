import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationsRead,
} from "../db";

export const notificationsRouter = router({
  // Get user's notifications
  list: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }).optional())
    .query(async ({ ctx, input }) => {
      return getUserNotifications(ctx.user.id, input?.limit ?? 20);
    }),

  // Get unread count (used for notification badge)
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await getUnreadNotificationCount(ctx.user.id);
    return { count };
  }),

  // Mark notifications as read
  markRead: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.number()).optional(), // if omitted, mark all as read
      })
    )
    .mutation(async ({ ctx, input }) => {
      await markNotificationsRead(ctx.user.id, input.ids);
      return { success: true };
    }),
});
