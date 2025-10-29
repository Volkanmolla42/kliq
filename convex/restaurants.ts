import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Restoran oluştur
export const create = mutation({
  args: {
    name: v.string(),
    ownerId: v.id("users"),
  },
  returns: v.object({
    restaurantId: v.id("restaurants"),
    inviteCode: v.string(),
  }),
  handler: async (ctx, args) => {
    console.log("Creating restaurant with name:", args.name);

    // Benzersiz 6 haneli kod oluştur
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    console.log("Generated code:", inviteCode);

    const restaurantId = await ctx.db.insert("restaurants", {
      name: args.name,
      inviteCode,
      ownerId: args.ownerId,
      createdAt: Date.now(),
    });
    console.log("Restaurant created with ID:", restaurantId);
 
    return { restaurantId, inviteCode };
  },
});

// Davet kodu ile restoran bul
export const getByCode = query({
  args: {
    code: v.string(),
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
    return await ctx.db
      .query("restaurants")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", args.code))
      .first();
  },
});

// Restoran detayları
export const get = query({
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

