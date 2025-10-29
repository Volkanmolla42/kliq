import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Bildirim gönder
export const send = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    fromUserId: v.id("users"),
    toUserId: v.optional(v.id("users")), // Belirli bir kişiye gönderiliyorsa
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
    category: v.union(
      v.literal("order"),
      v.literal("help"),
      v.literal("info"),
      v.literal("stock")
    ),
  },
  returns: v.id("notifications"),
  handler: async (ctx, args) => {
    console.log("Sending notification:", args);
    return await ctx.db.insert("notifications", {
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
  },
});

// Kullanıcının bildirimlerini listele
export const listByUser = query({
  args: {
    restaurantId: v.id("restaurants"),
    userId: v.id("users"),
    userRole: v.union(
      v.literal("owner"),
      v.literal("manager"),
      v.literal("waiter"),
      v.literal("kitchen"),
      v.literal("bar")
    ),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("notifications"),
      _creationTime: v.number(),
      restaurantId: v.id("restaurants"),
      fromUserId: v.id("users"),
      fromUserName: v.string(),
      fromUserRole: v.union(
        v.literal("owner"),
        v.literal("manager"),
        v.literal("waiter"),
        v.literal("kitchen"),
        v.literal("bar")
      ),
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
      category: v.union(
        v.literal("order"),
        v.literal("help"),
        v.literal("info"),
        v.literal("stock")
      ),
      isRead: v.boolean(),
      readBy: v.array(v.id("users")),
      respondedBy: v.optional(v.id("users")),
      responseTime: v.optional(v.number()),
      pushSent: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // Kullanıcıya özel gönderilen bildirimleri getir
    const directNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_to_user", (q) => q.eq("toUserId", args.userId))
      .order("desc")
      .take(limit);

    // Kullanıcının rolüne göre bildirimleri getir
    const roleNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_role", (q) =>
        q.eq("restaurantId", args.restaurantId).eq("toRole", args.userRole)
      )
      .order("desc")
      .take(limit);

    // "all" rolüne gönderilen bildirimleri de getir
    const allNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_role", (q) =>
        q.eq("restaurantId", args.restaurantId).eq("toRole", "all")
      )
      .order("desc")
      .take(limit);

    // Birleştir ve sırala
    const allCombined = [
      ...directNotifications,
      ...roleNotifications,
      ...allNotifications,
    ].sort((a, b) => b._creationTime - a._creationTime);

    // Limit uygula
    const notifications = allCombined.slice(0, limit);

    // Kullanıcı bilgilerini ekle
    const notificationsWithUsers = await Promise.all(
      notifications.map(async (notification) => {
        const fromUser = await ctx.db.get(notification.fromUserId);
        if (!fromUser) {
          throw new Error("User not found");
        }

        // Gönderen kullanıcının rolünü bul
        const membership = await ctx.db
          .query("restaurantMembers")
          .withIndex("by_user_and_restaurant", (q) =>
            q.eq("userId", notification.fromUserId).eq("restaurantId", args.restaurantId)
          )
          .first();

        if (!membership) {
          throw new Error("Membership not found");
        }

        return {
          ...notification,
          fromUserName: fromUser.name,
          fromUserRole: membership.role,
        };
      })
    );

    return notificationsWithUsers;
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
    if (!notification) {
      throw new Error("Notification not found");
    }

    // Kullanıcıyı readBy listesine ekle
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
    userRole: v.union(
      v.literal("owner"),
      v.literal("manager"),
      v.literal("waiter"),
      v.literal("kitchen"),
      v.literal("bar")
    ),
    userId: v.id("users"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    // Kullanıcıya özel gönderilen bildirimleri getir
    const directNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_to_user", (q) => q.eq("toUserId", args.userId))
      .collect();

    // Kullanıcının rolüne göre bildirimleri getir
    const roleNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_role", (q) =>
        q.eq("restaurantId", args.restaurantId).eq("toRole", args.userRole)
      )
      .collect();

    // "all" rolüne gönderilen bildirimleri de getir
    const allNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_role", (q) =>
        q.eq("restaurantId", args.restaurantId).eq("toRole", "all")
      )
      .collect();

    // Birleştir
    const allCombined = [
      ...directNotifications,
      ...roleNotifications,
      ...allNotifications,
    ];

    // Okunmamışları say
    const unread = allCombined.filter(
      (notification) => !notification.readBy.includes(args.userId)
    );

    return unread.length;
  },
});

