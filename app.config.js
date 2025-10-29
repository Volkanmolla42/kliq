module.exports = {
  expo: {
    name: "kliq",
    slug: "kliq",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "kliq",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    // iOS Configuration
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.kliq.app",
      buildNumber: "1",
      infoPlist: {
        NSCameraUsageDescription: "Kliq fotoğraf paylaşımı için kamera erişimi gerektirir.",
        NSPhotoLibraryUsageDescription: "Kliq fotoğraf paylaşımı için galeri erişimi gerektirir.",
        NSMicrophoneUsageDescription: "Kliq sesli mesajlar için mikrofon erişimi gerektirir.",
      },
    },

    // Android Configuration
    android: {
      package: "com.kliq.app",
      versionCode: 1,
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "RECORD_AUDIO",
        "NOTIFICATIONS",
      ],
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },

    // Web Configuration
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },

    // Plugins
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/notification-icon.png",
          color: "#000000",
          sounds: ["./assets/sounds/notification.wav"],
        },
      ],
    ],

    // Experiments
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },

    // Extra Configuration
    extra: {
      EXPO_PUBLIC_CONVEX_URL: process.env.EXPO_PUBLIC_CONVEX_URL,
      eas: {
        projectId: "your-project-id-here", // EAS Build için gerekli
      },
    },

    // Privacy & Legal
    privacy: "public",

    // Hooks
    hooks: {
      postPublish: [],
    },
  },
};

