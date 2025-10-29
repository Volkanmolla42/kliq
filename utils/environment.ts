/**
 * Environment Validation & Configuration
 * 
 * Production ortamında gerekli environment variables'ları kontrol eder.
 */

export interface EnvironmentConfig {
  convexUrl: string;
  isProduction: boolean;
  isDevelopment: boolean;
  appVersion: string;
  sentryDsn?: string;
}

export class EnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvironmentError";
  }
}

/**
 * Environment variables'ları validate et
 */
export function validateEnvironment(): EnvironmentConfig {
  const nodeEnv = process.env.NODE_ENV || "development";
  const isProduction = nodeEnv === "production";
  const isDevelopment = nodeEnv === "development";

  // Convex URL kontrolü
  const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

  if (!convexUrl) {
    if (isProduction) {
      throw new EnvironmentError(
        "EXPO_PUBLIC_CONVEX_URL is required in production environment"
      );
    }
    console.warn("⚠️ EXPO_PUBLIC_CONVEX_URL not set, using localhost fallback");
  }

  // Production'da HTTPS zorunlu
  if (convexUrl && isProduction && !convexUrl.startsWith("https://")) {
    throw new EnvironmentError(
      "Production environment requires HTTPS Convex URL. " +
      "Please update EXPO_PUBLIC_CONVEX_URL to use https://"
    );
  }

  // Localhost kontrolü (production'da izin verilmez)
  if (convexUrl && isProduction && convexUrl.includes("localhost")) {
    throw new EnvironmentError(
      "Production environment cannot use localhost. " +
      "Please deploy Convex and update EXPO_PUBLIC_CONVEX_URL"
    );
  }

  // App version
  const appVersion = process.env.EXPO_PUBLIC_APP_VERSION || "1.0.0";

  // Sentry DSN (optional)
  const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  if (isProduction && !sentryDsn) {
    console.warn("⚠️ EXPO_PUBLIC_SENTRY_DSN not set. Error tracking disabled.");
  }

  return {
    convexUrl: convexUrl || "http://localhost:3000",
    isProduction,
    isDevelopment,
    appVersion,
    sentryDsn,
  };
}

/**
 * Environment bilgilerini logla (debug için)
 */
export function logEnvironmentInfo(config: EnvironmentConfig) {
  console.log("🌍 Environment Configuration:");
  console.log(`  - Mode: ${config.isProduction ? "PRODUCTION" : "DEVELOPMENT"}`);
  console.log(`  - App Version: ${config.appVersion}`);
  console.log(`  - Convex URL: ${config.convexUrl}`);
  console.log(`  - Error Tracking: ${config.sentryDsn ? "ENABLED" : "DISABLED"}`);
}

/**
 * Production checklist kontrolü
 */
export function checkProductionReadiness(): {
  ready: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    const config = validateEnvironment();

    // Production kontrolü
    if (config.isProduction) {
      // Sentry kontrolü
      if (!config.sentryDsn) {
        warnings.push("Sentry DSN not configured - error tracking disabled");
      }

      // HTTPS kontrolü
      if (!config.convexUrl.startsWith("https://")) {
        errors.push("Production requires HTTPS Convex URL");
      }

      // Localhost kontrolü
      if (config.convexUrl.includes("localhost")) {
        errors.push("Production cannot use localhost");
      }
    }

    return {
      ready: errors.length === 0,
      warnings,
      errors,
    };
  } catch (error) {
    if (error instanceof EnvironmentError) {
      errors.push(error.message);
    } else {
      errors.push("Unknown environment error");
    }

    return {
      ready: false,
      warnings,
      errors,
    };
  }
}

/**
 * Development mode kontrolü
 */
export function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV !== "production";
}

/**
 * Production mode kontrolü
 */
export function isProductionMode(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Feature flags (gelecekte kullanılabilir)
 */
export const featureFlags = {
  enablePushNotifications: true,
  enableAnalytics: isProductionMode(),
  enableErrorTracking: isProductionMode(),
  enableDebugLogs: isDevelopmentMode(),
  enableBetaFeatures: isDevelopmentMode(),
};

