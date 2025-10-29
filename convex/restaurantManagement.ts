import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 6 haneli rastgele kod oluştur
function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Restoran oluştur
export const createRestaurant = mutation({
  args: {
    name: v.string(),
    ownerId: v.id("users"),
  },
  returns: v.object({
    restaurantId: v.id("restaurants"),
    inviteCode: v.string(),
  }),
  handler: async (ctx, args) => {
    // Benzersiz kod oluştur
    let inviteCode = generateInviteCode();
    let existing = await ctx.db
      .query("restaurants")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", inviteCode))
      .first();

    // Kod zaten varsa yeni kod oluştur
    while (existing) {
      inviteCode = generateInviteCode();
      existing = await ctx.db
        .query("restaurants")
        .withIndex("by_inviteCode", (q) => q.eq("inviteCode", inviteCode))
        .first();
    }

    // Restoran oluştur
    const restaurantId = await ctx.db.insert("restaurants", {
      name: args.name,
      inviteCode,
      ownerId: args.ownerId,
      createdAt: Date.now(),
    });

    // Sahibi owner olarak ekle
    await ctx.db.insert("restaurantMembers", {
      userId: args.ownerId,
      restaurantId,
      role: "owner",
      isOnline: true,
      lastSeen: Date.now(),
      joinedAt: Date.now(),
    });

    return { restaurantId, inviteCode };
  },
});

// Restorana katıl
export const joinRestaurant = mutation({
  args: {
    userId: v.id("users"),
    inviteCode: v.string(),
    role: v.union(
      v.literal("manager"),
      v.literal("waiter"),
      v.literal("kitchen"),
      v.literal("bar")
    ),
  },
  returns: v.object({
    success: v.boolean(),
    restaurantId: v.optional(v.id("restaurants")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Restoran bul
    const restaurant = await ctx.db
      .query("restaurants")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", args.inviteCode))
      .first();

    if (!restaurant) {
      return { success: false, error: "Restoran bulunamadı" };
    }

    // Zaten üye mi kontrol et
    const existingMember = await ctx.db
      .query("restaurantMembers")
      .withIndex("by_user_and_restaurant", (q) =>
        q.eq("userId", args.userId).eq("restaurantId", restaurant._id)
      )
      .first();

    if (existingMember) {
      return { success: false, error: "Bu restorana zaten üyesiniz" };
    }

    // Üye olarak ekle
    await ctx.db.insert("restaurantMembers", {
      userId: args.userId,
      restaurantId: restaurant._id,
      role: args.role,
      isOnline: true,
      lastSeen: Date.now(),
      joinedAt: Date.now(),
    });

    return { success: true, restaurantId: restaurant._id };
  },
});

// Kullanıcının restoranlarını listele
export const getUserRestaurants = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(
    v.object({
      _id: v.id("restaurants"),
      name: v.string(),
      inviteCode: v.string(),
      role: v.union(
        v.literal("owner"),
        v.literal("manager"),
        v.literal("waiter"),
        v.literal("kitchen"),
        v.literal("bar")
      ),
      isOwner: v.boolean(),
      memberCount: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    // Kullanıcının üye olduğu restoranları bul
    const memberships = await ctx.db
      .query("restaurantMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const restaurants = [];
    for (const membership of memberships) {
      const restaurant = await ctx.db.get(membership.restaurantId);
      if (!restaurant) continue;

      // Üye sayısını hesapla
      const members = await ctx.db
        .query("restaurantMembers")
        .withIndex("by_restaurant", (q) =>
          q.eq("restaurantId", restaurant._id)
        )
        .collect();

      restaurants.push({
        _id: restaurant._id,
        name: restaurant.name,
        inviteCode: restaurant.inviteCode,
        role: membership.role,
        isOwner: restaurant.ownerId === args.userId,
        memberCount: members.length,
      });
    }

    return restaurants;
  },
});

// Restoran bilgilerini getir
export const getRestaurant = query({
  args: {
    restaurantId: v.id("restaurants"),
  },
  returns: v.union(
    v.object({
      _id: v.id("restaurants"),
      _creationTime: v.number(),
      name: v.string(),
      inviteCode: v.string(),
      ownerId: v.id("users"),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.restaurantId);
  },
});

// Restoran üyelerini listele
export const getRestaurantMembers = query({
  args: {
    restaurantId: v.id("restaurants"),
  },
  returns: v.array(
    v.object({
      _id: v.id("restaurantMembers"),
      userId: v.id("users"),
      userName: v.string(),
      userEmail: v.string(),
      role: v.union(
        v.literal("owner"),
        v.literal("manager"),
        v.literal("waiter"),
        v.literal("kitchen"),
        v.literal("bar")
      ),
      isOnline: v.boolean(),
      lastSeen: v.number(),
      joinedAt: v.number(),
      pushToken: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("restaurantMembers")
      .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
      .collect();

    const members = [];
    for (const membership of memberships) {
      const user = await ctx.db.get(membership.userId);
      if (!user) continue;

      members.push({
        _id: membership._id,
        userId: membership.userId,
        userName: user.name,
        userEmail: user.email,
        role: membership.role,
        isOnline: membership.isOnline,
        lastSeen: membership.lastSeen,
        joinedAt: membership.joinedAt,
        pushToken: user.pushToken,
      });
    }

    return members;
  },
});

// Davet kodunu yenile
export const refreshInviteCode = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    userId: v.id("users"),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      newInviteCode: v.string(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const restaurant = await ctx.db.get(args.restaurantId);
    if (!restaurant) {
      return { success: false as const, error: "Restoran bulunamadı" };
    }

    // Sadece owner yenileyebilir
    if (restaurant.ownerId !== args.userId) {
      return { success: false as const, error: "Sadece restoran sahibi davet kodunu yenileyebilir" };
    }

    // Yeni kod oluştur
    let newInviteCode = generateInviteCode();
    let existing = await ctx.db
      .query("restaurants")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", newInviteCode))
      .first();

    while (existing) {
      newInviteCode = generateInviteCode();
      existing = await ctx.db
        .query("restaurants")
        .withIndex("by_inviteCode", (q) => q.eq("inviteCode", newInviteCode))
        .first();
    }

    // Kodu güncelle
    await ctx.db.patch(args.restaurantId, {
      inviteCode: newInviteCode,
    });

    return { success: true as const, newInviteCode };
  },
});

// Restoran adını güncelle
export const updateRestaurantName = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    userId: v.id("users"),
    newName: v.string(),
  },
  returns: v.union(
    v.object({ success: v.literal(true) }),
    v.object({ success: v.literal(false), error: v.string() })
  ),
  handler: async (ctx, args) => {
    const restaurant = await ctx.db.get(args.restaurantId);
    if (!restaurant) {
      return { success: false as const, error: "Restoran bulunamadı" };
    }

    // Sadece owner güncelleyebilir
    if (restaurant.ownerId !== args.userId) {
      return { success: false as const, error: "Sadece restoran sahibi adı değiştirebilir" };
    }

    await ctx.db.patch(args.restaurantId, {
      name: args.newName,
    });

    return { success: true as const };
  },
});

