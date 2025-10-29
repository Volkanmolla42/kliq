import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";
import { validateEnvironment, logEnvironmentInfo } from "../utils/environment";
import { errorTracker, setupGlobalErrorHandler } from "../utils/errorTracking";

// Environment validation
const config = validateEnvironment();
logEnvironmentInfo(config);

const convex = new ConvexReactClient(config.convexUrl, {
  unsavedChangesWarning: false,
});

// Error tracking başlat
errorTracker.init();
setupGlobalErrorHandler();

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <Stack screenOptions={{ headerShown: false }} />
    </ConvexProvider>
  );
}


