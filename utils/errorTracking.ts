/**
 * Error Tracking Utility
 *
 * Sentry ile error tracking.
 * Production'da otomatik olarak aktif olur.
 */

import * as Sentry from "@sentry/react-native";

interface ErrorContext {
  userId?: string;
  restaurantId?: string;
  action?: string;
  extra?: Record<string, unknown>;
}

class ErrorTracker {
  private isProduction: boolean;
  private isInitialized: boolean = false;

  constructor() {
    this.isProduction = process.env.NODE_ENV === "production";
  }

  /**
   * Error tracking servisini başlat
   * Production'da Sentry.init() çağrılır
   */
  init() {
    if (this.isInitialized) return;

    if (this.isProduction) {
      const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

      if (sentryDsn) {
        Sentry.init({
          dsn: sentryDsn,
          environment: 'production',
          enableInExpoDevelopment: false,
          tracesSampleRate: 1.0,
        });
        console.log("📊 Sentry initialized (production mode)");
      } else {
        console.warn("⚠️ EXPO_PUBLIC_SENTRY_DSN not found. Sentry disabled.");
      }
    } else {
      console.log("📊 Error tracking initialized (development mode)");
    }

    this.isInitialized = true;
  }

  /**
   * Hata logla
   */
  captureError(error: Error, context?: ErrorContext) {
    if (this.isProduction) {
      Sentry.captureException(error, {
        contexts: { custom: context }
      });
      console.error("❌ Error captured:", error.message, context);
    } else {
      console.error("❌ Error:", error.message, context);
      console.error(error.stack);
    }
  }

  /**
   * Mesaj logla (warning, info, etc.)
   */
  captureMessage(message: string, level: "info" | "warning" | "error" = "info", context?: ErrorContext) {
    if (this.isProduction) {
      Sentry.captureMessage(message, {
        level: level as Sentry.SeverityLevel,
        contexts: { custom: context }
      });
      console.log(`📝 [${level.toUpperCase()}] ${message}`, context);
    } else {
      console.log(`📝 [${level.toUpperCase()}] ${message}`, context);
    }
  }

  /**
   * Kullanıcı bilgisi set et
   */
  setUser(userId: string, email?: string, name?: string) {
    if (this.isProduction) {
      Sentry.setUser({ id: userId, email, username: name });
      console.log("👤 User set:", { userId, email, name });
    }
  }

  /**
   * Kullanıcı bilgisini temizle (logout)
   */
  clearUser() {
    if (this.isProduction) {
      Sentry.setUser(null);
      console.log("👤 User cleared");
    }
  }

  /**
   * Breadcrumb ekle (kullanıcı aksiyonları)
   */
  addBreadcrumb(message: string, category: string, data?: Record<string, unknown>) {
    if (this.isProduction) {
      Sentry.addBreadcrumb({ message, category, data });
      console.log(`🍞 Breadcrumb: [${category}] ${message}`, data);
    }
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker();

// Global error handler
export function setupGlobalErrorHandler() {
  if (typeof ErrorUtils !== "undefined") {
    const defaultHandler = ErrorUtils.getGlobalHandler();

    ErrorUtils.setGlobalHandler((error, isFatal) => {
      errorTracker.captureError(error, {
        extra: { isFatal },
      });

      // Orijinal handler'ı çağır
      defaultHandler(error, isFatal);
    });
  }

  // Unhandled promise rejections
  if (typeof global !== "undefined") {
    const originalHandler = global.onunhandledrejection;
    
    global.onunhandledrejection = (event: PromiseRejectionEvent) => {
      errorTracker.captureError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        {
          extra: { reason: event.reason },
        }
      );

      if (originalHandler) {
        originalHandler.call(global, event);
      }
    };
  }
}

// Helper functions
export function logAuthError(error: Error, action: "login" | "signup") {
  errorTracker.captureError(error, {
    action,
    extra: { type: "authentication" },
  });
}

export function logNetworkError(error: Error, endpoint?: string) {
  errorTracker.captureError(error, {
    action: "network_request",
    extra: { endpoint },
  });
}

export function logUserAction(action: string, data?: Record<string, unknown>) {
  errorTracker.addBreadcrumb(action, "user_action", data);
}

