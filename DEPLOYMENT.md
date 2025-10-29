# 🚀 kliq - Production Deployment Rehberi

Bu rehber, kliq uygulamasını production ortamına deploy etmek için gereken adımları açıklar.

## 📋 Ön Gereksinimler

### 1. Hesaplar
- [ ] Apple Developer Account ($99/yıl)
- [ ] Google Play Console Account ($25 tek seferlik)
- [ ] Expo Account (ücretsiz)
- [ ] Convex Account (ücretsiz başlangıç)

### 2. Kurulumlar
```bash
npm install -g eas-cli
eas login
```

## 🔧 Adım 1: Environment Variables

### 1.1 Production Convex Deployment
```bash
# Convex production deployment oluştur
npx convex deploy --prod

# Deployment URL'ini kopyala (örn: https://your-deployment.convex.cloud)
```

### 1.2 .env Dosyası Oluştur
```bash
# .env.production dosyası oluştur
cp .env.example .env.production
```

`.env.production` içeriği:
```
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NODE_ENV=production
APP_VERSION=1.0.0
```

## 🍎 Adım 2: iOS Build

### 2.1 EAS Project Oluştur
```bash
eas build:configure
```

### 2.2 iOS Bundle Identifier Güncelle
`app.config.js` dosyasında:
```javascript
ios: {
  bundleIdentifier: "com.yourcompany.kliq", // Kendi bundle ID'nizi kullanın
}
```

### 2.3 iOS Build
```bash
# Development build
eas build --platform ios --profile development

# Production build
eas build --platform ios --profile production
```

### 2.4 TestFlight'a Yükle
```bash
eas submit --platform ios
```

## 🤖 Adım 3: Android Build

### 3.1 Android Package Name Güncelle
`app.config.js` dosyasında:
```javascript
android: {
  package: "com.yourcompany.kliq", // Kendi package name'inizi kullanın
}
```

### 3.2 Keystore Oluştur
```bash
# EAS otomatik oluşturur, manuel oluşturmak isterseniz:
keytool -genkeypair -v -keystore kliq-release.keystore -alias kliq -keyalg RSA -keysize 2048 -validity 10000
```

### 3.3 Android Build
```bash
# Development build
eas build --platform android --profile development

# Production build (AAB)
eas build --platform android --profile production
```

### 3.4 Google Play'e Yükle
```bash
eas submit --platform android
```

## 📱 Adım 4: App Store Metadata

### 4.1 iOS App Store Connect

1. **App Information**
   - Name: kliq
   - Subtitle: Restoran İçi İletişim
   - Category: Business / Productivity

2. **Privacy Policy URL**
   - Yükle: `PRIVACY_POLICY.md` → Web'e yükle
   - URL: `https://yourwebsite.com/privacy`

3. **Screenshots** (Gerekli boyutlar)
   - 6.5" iPhone: 1284 x 2778 px (6 adet)
   - 5.5" iPhone: 1242 x 2208 px (6 adet)
   - iPad Pro: 2048 x 2732 px (6 adet)

4. **App Description**
```
kliq - Restoran İçi İletişim Uygulaması

Restoran çalışanları için tasarlanmış hızlı ve güvenli iletişim platformu.

ÖZELLİKLER:
✅ Gerçek zamanlı mesajlaşma
✅ Kanal bazlı iletişim (Genel, Mutfak, Servis, Acil)
✅ Hızlı mesaj şablonları
✅ Rol bazlı yetkilendirme
✅ Push bildirimleri
✅ Offline destek

ROLLER:
• Yönetici - Tam kontrol
• Garson - Servis kanalı
• Mutfak - Mutfak kanalı
• Bar - Bar kanalı

GÜVENLİK:
🔒 Şifreli iletişim
🔒 Güvenli kimlik doğrulama
🔒 KVKK/GDPR uyumlu
```

### 4.2 Google Play Console

1. **Store Listing**
   - App name: kliq
   - Short description: Restoran çalışanları için hızlı iletişim
   - Full description: (Yukarıdaki iOS açıklamasını kullan)

2. **Graphics**
   - Icon: 512 x 512 px
   - Feature graphic: 1024 x 500 px
   - Screenshots: En az 2 adet (phone + tablet)

3. **Categorization**
   - Category: Business
   - Content rating: Everyone

## 🔐 Adım 5: Güvenlik Kontrolleri

### 5.1 Checklist
- [ ] Tüm şifreler bcrypt ile hash'leniyor
- [ ] HTTPS kullanılıyor (production Convex URL)
- [ ] Environment variables doğru ayarlanmış
- [ ] API keys güvenli saklanıyor
- [ ] Input validation aktif
- [ ] Error handling düzgün çalışıyor

### 5.2 Test
```bash
# Production build'i test et
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

## 📊 Adım 6: Monitoring & Analytics (Opsiyonel)

### 6.1 Sentry (Error Tracking)
```bash
npm install @sentry/react-native
npx @sentry/wizard -i reactNative -p ios android
```

### 6.2 Firebase Analytics
```bash
npm install @react-native-firebase/app @react-native-firebase/analytics
```

## 🚦 Adım 7: Release Checklist

### Pre-Release
- [ ] Tüm testler geçiyor
- [ ] Beta testing tamamlandı
- [ ] Privacy Policy ve Terms yayında
- [ ] Screenshots hazır
- [ ] App Store metadata tamamlandı
- [ ] Production Convex deployment aktif
- [ ] Environment variables ayarlandı

### Release
- [ ] iOS build oluşturuldu
- [ ] Android build oluşturuldu
- [ ] TestFlight'a yüklendi (iOS)
- [ ] Internal testing'e yüklendi (Android)
- [ ] Beta testerlar davet edildi
- [ ] Feedback toplandı

### Post-Release
- [ ] App Store'da yayınlandı
- [ ] Google Play'de yayınlandı
- [ ] Monitoring aktif
- [ ] Support email aktif
- [ ] Kullanıcı feedback'i izleniyor

## 🆘 Sorun Giderme

### Build Hataları
```bash
# Cache temizle
eas build:clear-cache

# Node modules temizle
rm -rf node_modules
npm install

# Convex yeniden deploy
npx convex deploy --prod
```

### Environment Variable Hataları
```bash
# EAS secrets kontrol et
eas secret:list

# Secret ekle
eas secret:create --name EXPO_PUBLIC_CONVEX_URL --value https://your-deployment.convex.cloud
```

## 📞 Destek

Sorunlarla karşılaşırsanız:
- Expo Docs: https://docs.expo.dev
- Convex Docs: https://docs.convex.dev
- EAS Build: https://docs.expo.dev/build/introduction/

## 🎉 Tebrikler!

Uygulamanız artık production'da! 🚀

