import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

/**
 * Rate Limiting System
 * 
 * Prevents abuse by limiting the number of requests per user/IP
 * within a specific time window.
 */

// Rate limit configuration
const RATE_LIMITS = {
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  signup: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  message: {
    maxAttempts: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  notification: {
    maxAttempts: 50,
    windowMs: 60 * 1000, // 1 minute
  },
};

// Check if rate limit is exceeded
export const checkRateLimit = internalQuery({
  args: {
    identifier: v.string(), // user ID or IP address
    action: v.union(
      v.literal("login"),
      v.literal("signup"),
      v.literal("message"),
      v.literal("notification")
    ),
  },
  returns: v.object({
    allowed: v.boolean(),
    remainingAttempts: v.number(),
    resetTime: v.number(),
  }),
  handler: async (ctx, args) => {
    const config = RATE_LIMITS[args.action];
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get recent attempts
    const attempts = await ctx.db
      .query("rateLimits")
      .withIndex("by_identifier_and_action", (q) =>
        q.eq("identifier", args.identifier).eq("action", args.action)
      )
      .filter((q) => q.gte(q.field("timestamp"), windowStart))
      .collect();

    const attemptCount = attempts.length;
    const allowed = attemptCount < config.maxAttempts;
    const remainingAttempts = Math.max(0, config.maxAttempts - attemptCount);
    
    // Calculate reset time (oldest attempt + window)
    const oldestAttempt = attempts.length > 0 
      ? Math.min(...attempts.map(a => a.timestamp))
      : now;
    const resetTime = oldestAttempt + config.windowMs;

    return {
      allowed,
      remainingAttempts,
      resetTime,
    };
  },
});

// Record a rate limit attempt
export const recordAttempt = internalMutation({
  args: {
    identifier: v.string(),
    action: v.union(
      v.literal("login"),
      v.literal("signup"),
      v.literal("message"),
      v.literal("notification")
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("rateLimits", {
      identifier: args.identifier,
      action: args.action,
      timestamp: Date.now(),
    });
    return null;
  },
});

// Clean up old rate limit records (should be called periodically)
export const cleanupOldRecords = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const maxWindowMs = Math.max(
      ...Object.values(RATE_LIMITS).map((limit) => limit.windowMs)
    );
    const cutoffTime = Date.now() - maxWindowMs;

    const oldRecords = await ctx.db
      .query("rateLimits")
      .filter((q) => q.lt(q.field("timestamp"), cutoffTime))
      .collect();

    for (const record of oldRecords) {
      await ctx.db.delete(record._id);
    }

    return null;
  },
});

