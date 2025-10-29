import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Kullanıcı oluştur
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    // Basit hash fonksiyonu - varsayılan şifre
    const hashPassword = (pwd: string) => {
      let hash = 0;
      for (let i = 0; i < pwd.length; i++) {
        const char = pwd.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      return hash.toString(36);
    };

    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      passwordHash: hashPassword("default123"), // Varsayılan şifre
      createdAt: Date.now(),
    });
    return userId;
  },
});

// Email ile kullanıcı bul
export const getByEmail = query({
  args: {
    email: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.string(),
      email: v.string(),
      passwordHash: v.string(),
      pushToken: v.optional(v.string()),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Restoran çalışanlarını listele
export const listByRestaurant = query({
  args: {
    restaurantId: v.id("restaurants"),
  },
  returns: v.array(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.string(),
      email: v.string(),
      pushToken: v.optional(v.string()),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    // Get restaurant members first
    const memberships = await ctx.db
      .query("restaurantMembers")
      .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
      .collect();

    // Then get user details for each member
    const users = [];
    for (const membership of memberships) {
      const user = await ctx.db.get(membership.userId);
      if (user) {
        users.push(user);
      }
    }
    return users;
  },
});

// Online durumu güncelle (for a specific restaurant)
export const updateOnlineStatus = mutation({
  args: {
    userId: v.id("users"),
    restaurantId: v.id("restaurants"),
    isOnline: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Find the restaurant member record
    const membership = await ctx.db
      .query("restaurantMembers")
      .withIndex("by_user_and_restaurant", (q) =>
        q.eq("userId", args.userId).eq("restaurantId", args.restaurantId)
      )
      .first();

    if (membership) {
      await ctx.db.patch(membership._id, {
        isOnline: args.isOnline,
        lastSeen: Date.now(),
      });
    }
    return null;
  },
});

// Kullanıcı bilgilerini getir
export const get = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.string(),
      email: v.string(),
      passwordHash: v.string(),
      pushToken: v.optional(v.string()),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

