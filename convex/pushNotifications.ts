"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";

// Expo Push Notification gönder
export const sendPushNotification = internalAction({
  args: {
    pushToken: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const message = {
        to: args.pushToken,
        sound: "default",
        title: args.title,
        body: args.body,
        data: args.data || {},
        priority: "high",
      };

      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      
      if (result.data && result.data.status === "error") {
        return { success: false, error: result.data.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
});

// Birden fazla kişiye push notification gönder
export const sendBulkPushNotifications = internalAction({
  args: {
    pushTokens: v.array(v.string()),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  returns: v.object({
    success: v.boolean(),
    sentCount: v.number(),
    failedCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const messages = args.pushTokens.map((token) => ({
      to: token,
      sound: "default",
      title: args.title,
      body: args.body,
      data: args.data || {},
      priority: "high",
    }));

    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      
      let sentCount = 0;
      let failedCount = 0;

      if (result.data) {
        for (const item of result.data) {
          if (item.status === "ok") {
            sentCount++;
          } else {
            failedCount++;
          }
        }
      }

      return { success: true, sentCount, failedCount };
    } catch (error) {
      return { success: false, sentCount: 0, failedCount: args.pushTokens.length };
    }
  },
});

