"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import bcrypt from "bcryptjs";

// Email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password validation
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: "Şifre en az 8 karakter olmalıdır" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Şifre en az bir büyük harf içermelidir" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "Şifre en az bir küçük harf içermelidir" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Şifre en az bir rakam içermelidir" };
  }
  return { valid: true };
}

/**
 * Signup action - Yeni kullanıcı kaydı
 * Bcrypt kullandığı için Node.js runtime'da çalışır
 */
export const signup = action({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      userId: v.id("users"),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const identifier = args.email.toLowerCase().trim();

    // Rate limiting kontrolü
    const rateLimit = await ctx.runQuery(internal.rateLimit.checkRateLimit, {
      identifier,
      action: "signup",
    });

    if (!rateLimit.allowed) {
      const resetDate = new Date(rateLimit.resetTime);
      return {
        success: false as const,
        error: `Çok fazla kayıt denemesi. Lütfen ${resetDate.toLocaleTimeString("tr-TR")} sonra tekrar deneyin.`,
      };
    }

    // Input validation
    if (!args.name || args.name.trim().length < 2) {
      return { success: false as const, error: "İsim en az 2 karakter olmalıdır" };
    }

    if (!isValidEmail(args.email)) {
      return { success: false as const, error: "Geçersiz email adresi" };
    }

    const passwordValidation = validatePassword(args.password);
    if (!passwordValidation.valid) {
      return { success: false as const, error: passwordValidation.error! };
    }

    // Email'in zaten kullanılıp kullanılmadığını kontrol et
    const existingUser = await ctx.runQuery(internal.auth.checkEmailExists, {
      email: identifier,
    });

    if (existingUser) {
      return { success: false as const, error: "Bu email zaten kullanılıyor" };
    }

    // Şifreyi bcrypt ile hashle (salt rounds: 10)
    const passwordHash = await bcrypt.hash(args.password, 10);

    // Kullanıcıyı oluştur
    const userId = await ctx.runMutation(internal.auth.createUser, {
      name: args.name.trim(),
      email: identifier,
      passwordHash,
    });

    // Rate limit kaydı
    await ctx.runMutation(internal.rateLimit.recordAttempt, {
      identifier,
      action: "signup",
    });

    return { success: true as const, userId };
  },
});

/**
 * Login action - Kullanıcı girişi
 * Bcrypt kullandığı için Node.js runtime'da çalışır
 */
export const login = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      userId: v.id("users"),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const identifier = args.email.toLowerCase().trim();

    // Rate limiting kontrolü
    const rateLimit = await ctx.runQuery(internal.rateLimit.checkRateLimit, {
      identifier,
      action: "login",
    });

    if (!rateLimit.allowed) {
      const resetDate = new Date(rateLimit.resetTime);
      return {
        success: false as const,
        error: `Çok fazla giriş denemesi. Lütfen ${resetDate.toLocaleTimeString("tr-TR")} sonra tekrar deneyin.`,
      };
    }

    // Input validation
    if (!isValidEmail(args.email)) {
      await ctx.runMutation(internal.rateLimit.recordAttempt, {
        identifier,
        action: "login",
      });
      return { success: false as const, error: "Geçersiz email adresi" };
    }

    if (!args.password) {
      return { success: false as const, error: "Şifre gereklidir" };
    }

    // Kullanıcıyı bul
    const user = await ctx.runQuery(internal.auth.getUserByEmail, {
      email: identifier,
    });

    if (!user) {
      // Rate limit kaydı (başarısız deneme)
      await ctx.runMutation(internal.rateLimit.recordAttempt, {
        identifier,
        action: "login",
      });
      return { success: false as const, error: "Email veya şifre hatalı" };
    }

    // Şifreyi bcrypt ile kontrol et
    const isPasswordValid = await bcrypt.compare(args.password, user.passwordHash);
    
    if (!isPasswordValid) {
      // Rate limit kaydı (başarısız deneme)
      await ctx.runMutation(internal.rateLimit.recordAttempt, {
        identifier,
        action: "login",
      });
      return { success: false as const, error: "Email veya şifre hatalı" };
    }

    // Başarılı giriş - rate limit kaydı yapma
    return {
      success: true as const,
      userId: user._id,
    };
  },
});

