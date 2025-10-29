# İsteğe Bağlı Paketler

Bu paketler uygulamanın gelişmiş özelliklerini kullanmak için gereklidir.

## 📦 Network Status Monitoring

Kullanıcının internet bağlantısını izlemek için:

```bash
npm install @react-native-community/netinfo
```

**Kullanım:**
- `utils/networkStatus.ts` dosyasında hazır
- Offline durumunda kullanıcıya bildirim gösterir
- Network değişikliklerini real-time izler

**Örnek:**
```typescript
import { useNetworkStatus, getOfflineMessage } from "../utils/networkStatus";

function MyComponent() {
  const networkState = useNetworkStatus();
  const offlineMessage = getOfflineMessage(networkState);
  
  if (offlineMessage) {
    return <Text>{offlineMessage}</Text>;
  }
  
  return <YourContent />;
}
```

---

## 🔍 Error Tracking (Sentry)

Production'da hataları izlemek için:

```bash
npm install @sentry/react-native
npx @sentry/wizard -i reactNative -p ios android
```

**Kullanım:**
- `utils/errorTracking.ts` dosyasında hazır
- TODO yorumlarını Sentry kodları ile değiştirin
- `EXPO_PUBLIC_SENTRY_DSN` environment variable ekleyin

**Örnek:**
```typescript
import { errorTracker } from "../utils/errorTracking";

// Hata logla
errorTracker.captureError(error, { userId: "123" });

// Kullanıcı bilgisi set et
errorTracker.setUser(userId, email, name);

// Breadcrumb ekle
errorTracker.addBreadcrumb("User clicked button", "user_action");
```

---

## 📊 Analytics (Firebase)

Kullanıcı davranışlarını izlemek için:

```bash
npm install @react-native-firebase/app @react-native-firebase/analytics
```

**Kurulum:**
1. Firebase Console'da proje oluştur
2. iOS için `GoogleService-Info.plist` ekle
3. Android için `google-services.json` ekle
4. `app.config.js`'e Firebase plugin ekle

**Örnek:**
```typescript
import analytics from '@react-native-firebase/analytics';

// Event logla
await analytics().logEvent('user_login', {
  method: 'email',
});

// Screen view logla
await analytics().logScreenView({
  screen_name: 'Home',
  screen_class: 'HomeScreen',
});
```

---

## 🔔 Advanced Push Notifications

Daha gelişmiş push notification özellikleri için:

```bash
npm install @notifee/react-native
```

**Özellikler:**
- Local notifications
- Scheduled notifications
- Rich notifications (images, actions)
- Notification channels (Android)

**Örnek:**
```typescript
import notifee from '@notifee/react-native';

// Local notification göster
await notifee.displayNotification({
  title: 'Yeni Mesaj',
  body: 'Mutfaktan acil yardım talebi',
  android: {
    channelId: 'urgent',
    importance: AndroidImportance.HIGH,
  },
});
```

---

## 🎨 UI Components (React Native Paper)

Hazır Material Design componentleri için:

```bash
npm install react-native-paper react-native-vector-icons
```

**Özellikler:**
- Button, Card, Dialog, Snackbar
- Material Design 3 desteği
- Theming sistemi
- Accessibility desteği

---

## 🗺️ Maps (React Native Maps)

Harita özellikleri için:

```bash
npm install react-native-maps
```

**Kullanım Senaryoları:**
- Restoran lokasyonu gösterme
- Delivery tracking
- Çalışan lokasyon paylaşımı

---

## 📸 Image Picker

Fotoğraf seçme ve çekme için:

```bash
npx expo install expo-image-picker
```

**Özellikler:**
- Kamera erişimi
- Galeri erişimi
- Image cropping
- Multiple selection

**Örnek:**
```typescript
import * as ImagePicker from 'expo-image-picker';

const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [4, 3],
  quality: 1,
});
```

---

## 🔐 Biometric Authentication

Parmak izi / Face ID için:

```bash
npx expo install expo-local-authentication
```

**Özellikler:**
- Face ID (iOS)
- Touch ID (iOS)
- Fingerprint (Android)
- Fallback to PIN

**Örnek:**
```typescript
import * as LocalAuthentication from 'expo-local-authentication';

const result = await LocalAuthentication.authenticateAsync({
  promptMessage: 'Giriş yapmak için doğrulayın',
  fallbackLabel: 'PIN kullan',
});
```

---

## 📱 App State Management (Zustand)

Global state management için:

```bash
npm install zustand
```

**Avantajları:**
- Redux'tan daha basit
- TypeScript desteği
- Minimal boilerplate
- React hooks ile entegrasyon

**Örnek:**
```typescript
import create from 'zustand';

const useStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
```

---

## 🧪 Testing

Test yazmak için:

```bash
npm install --save-dev jest @testing-library/react-native
```

**Test Türleri:**
- Unit tests
- Integration tests
- Component tests
- E2E tests (Detox)

---

## 📝 Notlar

- Bu paketler **opsiyoneldir**
- Sadece ihtiyacınız olanları yükleyin
- Her paket için dokümantasyonu okuyun
- Production'da test edin

---

## 🚀 Önerilen Paketler (Production için)

**Mutlaka Yükleyin:**
1. ✅ `@sentry/react-native` - Error tracking
2. ✅ `@react-native-community/netinfo` - Network monitoring

**Önerilir:**
3. 📊 Firebase Analytics - Kullanıcı davranışı
4. 🔐 Expo Local Authentication - Biometric auth
5. 📸 Expo Image Picker - Fotoğraf paylaşımı

**İsteğe Bağlı:**
6. React Native Paper - UI components
7. Zustand - State management
8. Notifee - Advanced notifications

---

**Son Güncelleme:** 28 Ekim 2025

