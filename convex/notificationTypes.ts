import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Restoran için bildirim türlerini listele
export const listByRestaurant = query({
  args: {
    restaurantId: v.id("restaurants"),
  },
  returns: v.array(
    v.object({
      _id: v.id("notificationTypes"),
      _creationTime: v.number(),
      restaurantId: v.id("restaurants"),
      title: v.string(),
      icon: v.string(),
      color: v.string(),
      order: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const types = await ctx.db
      .query("notificationTypes")
      .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
      .collect();

    return types.sort((a, b) => a.order - b.order);
  },
});

// Bildirim türü ekle (sadece restoran sahibi)
export const create = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    userId: v.id("users"),
    title: v.string(),
    icon: v.string(),
    color: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    typeId: v.optional(v.id("notificationTypes")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Restoran sahibi mi kontrol et
    const restaurant = await ctx.db.get(args.restaurantId);
    if (!restaurant) {
      return { success: false, error: "Restoran bulunamadı" };
    }

    if (restaurant.ownerId !== args.userId) {
      return { success: false, error: "Sadece restoran sahibi bildirim türü ekleyebilir" };
    }

    // Mevcut türlerin sayısını al (order için)
    const existingTypes = await ctx.db
      .query("notificationTypes")
      .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
      .collect();

    const typeId = await ctx.db.insert("notificationTypes", {
      restaurantId: args.restaurantId,
      title: args.title,
      icon: args.icon,
      color: args.color,
      order: existingTypes.length,
    });

    return { success: true, typeId };
  },
});

// Bildirim türünü sil (sadece restoran sahibi)
export const remove = mutation({
  args: {
    typeId: v.id("notificationTypes"),
    userId: v.id("users"),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const type = await ctx.db.get(args.typeId);
    if (!type) {
      return { success: false, error: "Bildirim türü bulunamadı" };
    }

    // Restoran sahibi mi kontrol et
    const restaurant = await ctx.db.get(type.restaurantId);
    if (!restaurant) {
      return { success: false, error: "Restoran bulunamadı" };
    }

    if (restaurant.ownerId !== args.userId) {
      return { success: false, error: "Sadece restoran sahibi bildirim türü silebilir" };
    }

    await ctx.db.delete(args.typeId);
    return { success: true };
  },
});

// Varsayılan bildirim türlerini oluştur
export const createDefaults = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Restoran sahibi mi kontrol et
    const restaurant = await ctx.db.get(args.restaurantId);
    if (!restaurant || restaurant.ownerId !== args.userId) {
      return null;
    }

    const defaults = [
      { title: "Moladayım", icon: "☕", color: "#2196F3" },
      { title: "Acil Yardım Lazım", icon: "🆘", color: "#F44336" },
      { title: "Sipariş Hazır", icon: "✅", color: "#4CAF50" },
      { title: "Malzeme Bitti", icon: "📦", color: "#FF9800" },
      { title: "Müşteri Çağırıyor", icon: "🔔", color: "#9C27B0" },
    ];

    for (let i = 0; i < defaults.length; i++) {
      await ctx.db.insert("notificationTypes", {
        restaurantId: args.restaurantId,
        title: defaults[i].title,
        icon: defaults[i].icon,
        color: defaults[i].color,
        order: i,
      });
    }

    return null;
  },
});

