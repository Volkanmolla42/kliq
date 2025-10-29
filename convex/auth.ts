import { v } from "convex/values";
import { internalQuery, internalMutation, query, mutation } from "./_generated/server";

/**
 * Authentication Queries and Mutations (V8 Runtime)
 *
 * Bu dosya sadece V8 runtime'da çalışan query ve mutation'ları içerir.
 * Bcrypt kullanan action'lar authActions.ts dosyasında.
 */

/**
 * Email'in zaten kullanılıp kullanılmadığını kontrol et (internal)
 */
export const checkEmailExists = internalQuery({
  args: {
    email: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    return user !== null;
  },
});

/**
 * Email ile kullanıcı bul (internal)
 */
export const getUserByEmail = internalQuery({
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
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    return user;
  },
});

/**
 * Yeni kullanıcı oluştur (internal)
 */
export const createUser = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      passwordHash: args.passwordHash,
      createdAt: Date.now(),
    });
    return userId;
  },
});

/**
 * Mevcut kullanıcıyı getir (public query)
 */
export const getCurrentUser = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      name: v.string(),
      email: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
    };
  },
});

/**
 * Push token kaydet (public mutation)
 */
export const savePushToken = mutation({
  args: {
    userId: v.id("users"),
    pushToken: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      pushToken: args.pushToken,
    });
    return null;
  },
});
