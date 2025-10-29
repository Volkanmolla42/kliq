 import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Restoranlar
  restaurants: defineTable({
    name: v.string(),
    inviteCode: v.string(), // 6 haneli davet kodu (yenilenebilir)
    ownerId: v.id("users"), // Restoran sahibi
    createdAt: v.number(),
  })
    .index("by_inviteCode", ["inviteCode"])
    .index("by_owner", ["ownerId"]),

  // Kullanıcılar - Bağımsız kullanıcı hesapları
  users: defineTable({
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(), // Şifrelenmiş şifre
    pushToken: v.optional(v.string()), // Expo push notification token
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  // Restoran üyelikleri - Bir kullanıcı birden fazla restorana üye olabilir
  restaurantMembers: defineTable({
    userId: v.id("users"),
    restaurantId: v.id("restaurants"),
    role: v.union(
      v.literal("owner"), // Restoran sahibi
      v.literal("manager"), // Yönetici
      v.literal("waiter"), // Garson
      v.literal("kitchen"), // Mutfak
      v.literal("bar") // Bar
    ),
    isOnline: v.boolean(),
    lastSeen: v.number(),
    joinedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_restaurant", ["restaurantId"])
    .index("by_user_and_restaurant", ["userId", "restaurantId"]),

  // Bildirim türleri - Restoran sahibi tarafından oluşturulur
  notificationTypes: defineTable({
    restaurantId: v.id("restaurants"),
    title: v.string(), // "Moladayım", "Acil Yardım Lazım", "Sipariş Hazır"
    icon: v.string(), // Emoji
    color: v.string(), // Renk kodu
    order: v.number(), // Sıralama
  }).index("by_restaurant", ["restaurantId"]),

  // Gönderilen bildirimler
  notifications: defineTable({
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
    ), // Belirli bir role gönderiliyorsa
    actionTitle: v.string(),
    message: v.optional(v.string()), // Opsiyonel ek mesaj
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
    readBy: v.array(v.id("users")), // Kimler okudu
    respondedBy: v.optional(v.id("users")), // Kim yanıtladı (soru/çağrı için)
    responseTime: v.optional(v.number()), // Yanıt süresi
    pushSent: v.boolean(), // Push notification gönderildi mi?
  })
    .index("by_restaurant", ["restaurantId"])
    .index("by_role", ["restaurantId", "toRole"])
    .index("by_priority", ["restaurantId", "priority"])
    .index("by_to_user", ["toUserId"]),

  // Rate limiting - API abuse önleme
  rateLimits: defineTable({
    identifier: v.string(), // user ID veya IP address
    action: v.union(
      v.literal("login"),
      v.literal("signup"),
      v.literal("message"),
      v.literal("notification")
    ),
    timestamp: v.number(),
  })
    .index("by_identifier_and_action", ["identifier", "action"])
    .index("by_timestamp", ["timestamp"]),
});

