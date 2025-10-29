import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";

// Bildirim gönder (role veya belirli kişiye)
export const send = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    fromUserId: v.id("users"),
    toUserId: v.optional(v.id("users")), // Belirli bir kişiye
    toRole: v.optional(
      v.union(
        v.literal("owner"),
        v.literal("manager"),
        v.literal("waiter"),
        v.literal("kitchen"),
        v.literal("bar"),
        v.literal("all")
      )
    ), // Belirli bir role
    actionTitle: v.string(),
    message: v.optional(v.string()),
    priority: v.union(
      v.literal("normal"),
      v.literal("urgent"),
      v.literal("question")
    ),
    category: v.union(
      v.literal("order"),
      v.literal("help"),
      v.literal("info"),
      v.literal("stock")
    ),
  },
  returns: v.id("notifications"),
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      restaurantId: args.restaurantId,
      fromUserId: args.fromUserId,
      toUserId: args.toUserId,
      toRole: args.toRole,
      actionTitle: args.actionTitle,
      message: args.message,
      priority: args.priority,
      category: args.category,
      isRead: false,
      readBy: [],
      pushSent: false,
    });

    // Push notification gönder (action olarak)
    await ctx.scheduler.runAfter(
      0,
      internal.notificationsNew.sendPushForNotification,
      {
        notificationId,
      }
    );

    return notificationId;
  },
});

// Push notification gönderme action'ı
export const sendPushForNotification = internalAction({
  args: {
    notificationId: v.id("notifications"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Notification bilgilerini al
    const notification = await ctx.runQuery(
      internal.notificationsNew.getNotificationDetails,
      { notificationId: args.notificationId }
    );

    if (!notification) return null;

    // Alıcıları belirle
    const recipients = await ctx.runQuery(
      internal.notificationsNew.getNotificationRecipients,
      {
        restaurantId: notification.restaurantId,
        toUserId: notification.toUserId,
        toRole: notification.toRole,
      }
    );

    // Push token'ları topla
    const pushTokens = recipients
      .filter((r: { userId: string; pushToken?: string }) => r.pushToken && r.userId !== notification.fromUserId)
      .map((r: { userId: string; pushToken?: string }) => r.pushToken!);

    if (pushTokens.length === 0) return null;

    // Push notification gönder
    const title = `${notification.fromUserName}: ${notification.actionTitle}`;
    const body = notification.message || "Yeni bildirim";

    await ctx.runAction(internal.pushNotifications.sendBulkPushNotifications, {
      pushTokens,
      title,
      body,
      data: {
        notificationId: args.notificationId,
        restaurantId: notification.restaurantId,
        priority: notification.priority,
      },
    });

    // Push gönderildi olarak işaretle
    await ctx.runMutation(internal.notificationsNew.markPushSent, {
      notificationId: args.notificationId,
    });

    return null;
  },
});

// Notification detaylarını al (internal)
export const getNotificationDetails = internalQuery({
  args: {
    notificationId: v.id("notifications"),
  },
  returns: v.union(
    v.object({
      restaurantId: v.id("restaurants"),
      fromUserId: v.id("users"),
      fromUserName: v.string(),
      toUserId: v.optional(v.id("users")),
      toRole: v.optional(
        v.union(
          v.literal("owner"),
          v.literal("manager"),
          v.literal("waiter"),
          v.literal("kitchen"),
          v.literal("bar"),
          v.literal("all")
        )
      ),
      actionTitle: v.string(),
      message: v.optional(v.string()),
      priority: v.union(
        v.literal("normal"),
        v.literal("urgent"),
        v.literal("question")
      ),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) return null;

    const fromUser = await ctx.db.get(notification.fromUserId);
    if (!fromUser) return null;

    return {
      restaurantId: notification.restaurantId,
      fromUserId: notification.fromUserId,
      fromUserName: fromUser.name,
      toUserId: notification.toUserId,
      toRole: notification.toRole,
      actionTitle: notification.actionTitle,
      message: notification.message,
      priority: notification.priority,
    };
  },
});

// Alıcıları belirle (internal)
export const getNotificationRecipients = internalQuery({
  args: {
    restaurantId: v.id("restaurants"),
    toUserId: v.optional(v.id("users")),
    toRole: v.optional(
      v.union(
        v.literal("owner"),
        v.literal("manager"),
        v.literal("waiter"),
        v.literal("kitchen"),
        v.literal("bar"),
        v.literal("all")
      )
    ),
  },
  returns: v.array(
    v.object({
      userId: v.id("users"),
      pushToken: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    // Belirli bir kişiye gönderiliyorsa
    if (args.toUserId) {
      const user = await ctx.db.get(args.toUserId);
      if (!user) return [];
      return [{ userId: args.toUserId, pushToken: user.pushToken }];
    }

    // Role göre gönderiliyorsa
    if (args.toRole) {
      const members = await ctx.db
        .query("restaurantMembers")
        .withIndex("by_restaurant", (q) =>
          q.eq("restaurantId", args.restaurantId)
        )
        .collect();

      const recipients = [];
      for (const member of members) {
        if (args.toRole === "all" || member.role === args.toRole) {
          const user = await ctx.db.get(member.userId);
          if (user) {
            recipients.push({
              userId: member.userId,
              pushToken: user.pushToken,
            });
          }
        }
      }
      return recipients;
    }

    return [];
  },
});

// Push gönderildi olarak işaretle (internal)
export const markPushSent = internalMutation({
  args: {
    notificationId: v.id("notifications"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      pushSent: true,
    });
    return null;
  },
});

// Kullanıcının bildirimlerini listele
export const listByUser = query({
  args: {
    restaurantId: v.id("restaurants"),
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("notifications"),
      _creationTime: v.number(),
      fromUserId: v.id("users"),
      fromUserName: v.string(),
      actionTitle: v.string(),
      message: v.optional(v.string()),
      priority: v.union(
        v.literal("normal"),
        v.literal("urgent"),
        v.literal("question")
      ),
      category: v.union(
        v.literal("order"),
        v.literal("help"),
        v.literal("info"),
        v.literal("stock")
      ),
      isRead: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    // Kullanıcının rolünü bul
    const membership = await ctx.db
      .query("restaurantMembers")
      .withIndex("by_user_and_restaurant", (q) =>
        q.eq("userId", args.userId).eq("restaurantId", args.restaurantId)
      )
      .first();

    if (!membership) return [];

    // Bildirimleri al
    const allNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
      .order("desc")
      .take(args.limit || 50);

    const result = [];
    for (const notification of allNotifications) {
      // Bu bildirim bu kullanıcıya mı?
      const isForUser =
        notification.toUserId === args.userId ||
        notification.toRole === "all" ||
        notification.toRole === membership.role;

      if (!isForUser) continue;

      const fromUser = await ctx.db.get(notification.fromUserId);
      if (!fromUser) continue;

      result.push({
        _id: notification._id,
        _creationTime: notification._creationTime,
        fromUserId: notification.fromUserId,
        fromUserName: fromUser.name,
        actionTitle: notification.actionTitle,
        message: notification.message,
        priority: notification.priority,
        category: notification.category,
        isRead: notification.readBy.includes(args.userId),
      });
    }

    return result;
  },
});

// Bildirimi okundu olarak işaretle
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) return null;

    if (!notification.readBy.includes(args.userId)) {
      await ctx.db.patch(args.notificationId, {
        readBy: [...notification.readBy, args.userId],
        isRead: true,
      });
    }

    return null;
  },
});

// Okunmamış bildirim sayısı
export const unreadCount = query({
  args: {
    restaurantId: v.id("restaurants"),
    userId: v.id("users"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    // Kullanıcının rolünü bul
    const membership = await ctx.db
      .query("restaurantMembers")
      .withIndex("by_user_and_restaurant", (q) =>
        q.eq("userId", args.userId).eq("restaurantId", args.restaurantId)
      )
      .first();

    if (!membership) return 0;

    // Bildirimleri al
    const allNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
      .collect();

    let count = 0;
    for (const notification of allNotifications) {
      const isForUser =
        notification.toUserId === args.userId ||
        notification.toRole === "all" ||
        notification.toRole === membership.role;

      if (isForUser && !notification.readBy.includes(args.userId)) {
        count++;
      }
    }

    return count;
  },
});

