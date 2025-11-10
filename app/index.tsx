import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAction } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { api } from "../convex/_generated/api";
import { Eye, EyeOff, Rocket, Sparkles } from 'lucide-react-native';

// Web için alert fonksiyonu
const showAlert = (title: string, message: string, buttons?: { text: string; onPress?: () => void }[]) => {
  if (Platform.OS === "web") {
    const result = window.confirm(`${title}\n\n${message}`);
    if (result && buttons && buttons[0]?.onPress) {
      buttons[0].onPress();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

const colors = {
  background: "#121212",
  primary: "#6200EE",
  primaryVariant: "#3700B3",
  secondary: "#03DAC6",
  error: "#CF6679",
  text: "#FFFFFF",
  textSecondary: "#AFAFAF",
  surface: "#1E1E1E",
  border: "#2E2E2E",
  placeholder: "#6E6E6E",
  success: "#4CAF50",
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
};

const typography = {
  h1: {
    fontSize: 36,
    fontWeight: "800",
  },
  h2: {
    fontSize: 18,
  },
  button: {
    fontSize: 18,
    fontWeight: "700",
  },
  input: {
    fontSize: 16,
  },
};

const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
}

export default function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const signup = useAction(api.authActions.signup);
  const login = useAction(api.authActions.login);

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert("Hata", "Lütfen tüm alanları doldurun");
      return;
    }

    setIsLoading(true);
    try {
      const result = await login({
        email,
        password,
      });

      if (!result.success) {
        showAlert("Hata", result.error);
        return;
      }

      await AsyncStorage.setItem("userId", result.userId);
      router.replace("/restaurant-select");
    } catch (error) {
      showAlert("Hata", "Giriş yapılamadı: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!name || !email || !password) {
      showAlert("Hata", "Lütfen tüm alanları doldurun");
      return;
    }

    if (password.length < 8) {
      showAlert("Hata", "Şifre en az 8 karakter olmalıdır");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      showAlert("Hata", "Şifre en az bir büyük harf içermelidir");
      return;
    }

    if (!/[a-z]/.test(password)) {
      showAlert("Hata", "Şifre en az bir küçük harf içermelidir");
      return;
    }

    if (!/[0-9]/.test(password)) {
      showAlert("Hata", "Şifre en az bir rakam içermelidir");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signup({
        name,
        email,
        password,
      });

      if (!result.success) {
        showAlert("Hata", result.error);
        return;
      }

      await AsyncStorage.setItem("userId", result.userId);

      showAlert("Başarılı!", "Hesabınız oluşturuldu", [
        { text: "Tamam", onPress: () => router.replace("/restaurant-select") },
      ]);
    } catch (error) {
      showAlert("Hata", (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.title}>kliq</Text>
        <Text style={styles.subtitle}>Restoran İletişimi</Text>

        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[styles.modeButton, mode === "login" && styles.modeButtonActive]}
            onPress={() => setMode("login")}
          >
            <Text style={[styles.modeText, mode === "login" && styles.modeTextActive]}>
              Giriş
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === "signup" && styles.modeButtonActive]}
            onPress={() => setMode("signup")}
          >
            <Text style={[styles.modeText, mode === "signup" && styles.modeTextActive]}>
              Kayıt Ol
            </Text>
          </TouchableOpacity>
        </View>

        {mode === "login" ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={colors.placeholder}
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Şifre"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholderTextColor={colors.placeholder}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <Eye color="gray" size={20} /> : <EyeOff color="gray" size={20} />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <Text style={styles.buttonText}>Yükleniyor... </Text>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.buttonText}>Giriş Yap</Text>
                  <Rocket size={16} color={colors.text} />
                </View>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Adınız"
              value={name}
              onChangeText={setName}
              placeholderTextColor={colors.placeholder}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={colors.placeholder}
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Şifre (min 6 karakter)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholderTextColor={colors.placeholder}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <Eye color="gray" size={20} /> : <EyeOff color="gray" size={20} />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <Text style={styles.buttonText}>Yükleniyor... </Text>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.buttonText}>Kayıt Ol</Text>
                  <Sparkles size={16} color={colors.text} />
                </View>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "center",
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.h2,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  modeSelector: {
    flexDirection: "row",
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
  },
  modeButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
  },
  modeText: {
    color: colors.textSecondary,
    fontSize: typography.input.fontSize,
    fontWeight: "600",
  },
  modeTextActive: {
    color: colors.text,
  },
  input: {
    width: "100%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    marginBottom: spacing.lg,
    ...typography.input,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passwordInput: {
    flex: 1,
    padding: spacing.md,
    color: colors.text,
    ...typography.input,
  },
  eyeButton: {
    padding: spacing.md,
  },
  button: {
    width: "100%",
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  buttonText: {
    color: colors.text,
    ...typography.button,
  },
});
