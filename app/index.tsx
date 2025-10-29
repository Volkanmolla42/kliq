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
              placeholderTextColor="#999"
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Şifre"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeIcon}>{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? "Yükleniyor... ⏳" : "Giriş Yap 🚀"}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Adınız"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#999"
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Şifre (min 6 karakter)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeIcon}>{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? "Yükleniyor... ⏳" : "Kayıt Ol 🎉"}
              </Text>
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
    backgroundColor: "#000",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 48,
  },
  modeSelector: {
    flexDirection: "row",
    marginBottom: 24,
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: "#fff",
  },
  modeText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  modeTextActive: {
    color: "#000",
  },
  input: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#222",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#222",
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: "#fff",
  },
  eyeButton: {
    padding: 16,
  },
  eyeIcon: {
    fontSize: 20,
  },
  roleSelector: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#111",
    alignItems: "center",
  },
  roleButtonActive: {
    backgroundColor: "#fff",
  },
  roleText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  roleTextActive: {
    color: "#000",
  },
  button: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#666",
    opacity: 0.6,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
});
