# ✅ YAPILACAKLAR LİSTESİ

Bu dosya, uygulamayı App Store ve Google Play'e yayınlamadan önce **SİZİN** yapmanız gereken adımları içerir.

---

## ✅ TAMAMLANDI - Convex Deploy Edildi

### ~~1. Convex'i Yeniden Generate Et~~ ✅

**TAMAMLANDI!** Convex başarıyla deploy edildi ve tüm type definitions güncellendi.

**Yapılan İşlemler:**
- ✅ `auth.ts` - V8 runtime'da çalışan query ve mutation'lar
- ✅ `authActions.ts` - Node.js runtime'da bcrypt kullanan action'lar
- ✅ `rateLimit.ts` - Rate limiting sistemi
- ✅ `crons.ts` - Otomatik temizlik cron job'u
- ✅ Frontend `app/index.tsx` - `api.authActions.signup` ve `api.authActions.login` kullanıyor
- ✅ Lint hataları temizlendi

**Sonuç:**
- ✅ TypeScript hataları yok
- ✅ Convex fonksiyonları hazır
- ✅ Bcrypt güvenli şifreleme aktif
- ✅ Rate limiting aktif

---

## 🔴 KRİTİK - HEMEN YAPILMASI GEREKENLER

### 1. Opsiyonel Paketleri Yükle (Önerilir)

#### A. Network Monitoring (ÖNERİLİR)

```bash
npm install @react-native-community/netinfo
```

**Kullanım:**
- `utils/networkStatus.ts` dosyası hazır
- Offline durumunda kullanıcıya bildirim gösterir

#### B. Error Tracking (ZORUNLU - Production için)

```bash
npm install @sentry/react-native
npx @sentry/wizard -i reactNative -p ios android
```

**Kurulum Sonrası:**
1. Sentry hesabı oluştur: https://sentry.io
2. DSN'i kopyala
3. `.env.production` dosyasına ekle:
   ```
   EXPO_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
   ```
4. `utils/errorTracking.ts`'deki TODO yorumlarını Sentry kodları ile değiştir

---

### 3. Production Environment Hazırla

#### A. `.env.production` Dosyası Oluştur

```bash
# .env.production dosyası oluştur
cp .env.example .env.production
```

**İçeriği düzenle:**
```env
# Production Convex URL (henüz yok, adım 4'te alacaksınız)
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Environment
NODE_ENV=production

# App Version
EXPO_PUBLIC_APP_VERSION=1.0.0

# Sentry DSN (adım 2B'den)
EXPO_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

---

### 4. Convex'i Production'a Deploy Et

```bash
npx convex deploy --prod
```

**Çıktıda göreceğiniz:**
```
Deployment URL: https://your-deployment.convex.cloud
```

**Bu URL'i kopyala ve `.env.production` dosyasına ekle!**

---

### 5. EAS Build Hesabı Oluştur

```bash
npm install -g eas-cli
eas login
```

**Hesap yoksa:**
```bash
eas register
```

**Proje yapılandır:**
```bash
eas build:configure
```

---

## 🟡 ÖNEMLİ - YAYINLAMADAN ÖNCE

### 6. Apple Developer Hesabı

**Gereksinimler:**
- Apple Developer Program üyeliği ($99/yıl)
- https://developer.apple.com

**Yapılacaklar:**
1. Hesap oluştur
2. Bundle ID kaydet: `com.kliq.app`
3. App Store Connect'te uygulama oluştur

---

### 7. Google Play Console Hesabı

**Gereksinimler:**
- Google Play Developer hesabı ($25 tek seferlik)
- https://play.google.com/console

**Yapılacaklar:**
1. Hesap oluştur
2. Package name kaydet: `com.kliq.app`
3. Uygulama oluştur

---

### 8. Privacy Policy ve Terms Yayınla

**Neden Gerekli:**
- App Store ve Google Play zorunlu kılıyor
- KVKK/GDPR uyumluluğu için

**Yapılacaklar:**

#### Seçenek 1: GitHub Pages (ÜCRETSİZ)
```bash
# GitHub'da yeni repo oluştur: kliq-legal
# Settings > Pages > Enable

# Privacy Policy'yi yükle
# URL: https://yourusername.github.io/kliq-legal/privacy-policy.html
```

#### Seçenek 2: Kendi Web Siteniz
```
https://kliq.app/privacy-policy
https://kliq.app/terms-of-service
```

**Sonra:**
1. URL'leri kopyala
2. `app.config.js`'e ekle:
```javascript
ios: {
  config: {
    usesNonExemptEncryption: false,
  },
  infoPlist: {
    NSPrivacyPolicyURL: "https://your-url/privacy-policy",
  },
},
```

---

### 9. App Screenshots Hazırla

**iOS Gereksinimleri:**
- iPhone 6.7" (iPhone 15 Pro Max) - En az 3 adet
- iPhone 5.5" (iPhone 8 Plus) - En az 3 adet
- iPad Pro 12.9" - En az 3 adet (opsiyonel)

**Android Gereksinimleri:**
- Phone (1080x1920) - En az 2 adet
- 7" Tablet (1200x1920) - Opsiyonel
- 10" Tablet (1600x2560) - Opsiyonel

**Nasıl Alınır:**
1. Simulator/Emulator'da uygulamayı aç
2. Önemli ekranları screenshot al:
   - Login/Signup ekranı
   - Ana ekran (kanallar)
   - Mesajlaşma ekranı
   - Bildirim gönderme
   - Ayarlar

**Araçlar:**
- iOS: Xcode Simulator > File > New Screen Shot
- Android: Android Studio Emulator > Screenshot button

---

### 10. App Icon Hazırla

**Gereksinimler:**
- 1024x1024 PNG (App Store)
- 512x512 PNG (Google Play)
- Şeffaf arka plan YOK
- Köşeler yuvarlatılmamış (sistem otomatik yapar)

**Araçlar:**
- Figma (ücretsiz)
- Canva (ücretsiz)
- Adobe Illustrator

**Sonra:**
```bash
# Icon'u assets/images/ klasörüne koy
# app.config.js'de zaten tanımlı:
icon: "./assets/images/icon.png"
```

---

## 🟢 İSTEĞE BAĞLI - İYİLEŞTİRMELER

### 11. Beta Testing

**iOS - TestFlight:**
```bash
# Build al
npm run build:ios

# TestFlight'a yükle
npm run submit:ios

# App Store Connect > TestFlight > Tester ekle
```

**Android - Internal Testing:**
```bash
# Build al
npm run build:android

# Google Play Console > Internal Testing > Upload
```

**Test Süresi:**
- Minimum 1 hafta
- 10-20 kullanıcı
- Feedback topla

---

### 12. Analytics Kur (Önerilir)

```bash
npm install @react-native-firebase/app @react-native-firebase/analytics
```

**Firebase Console:**
1. Proje oluştur: https://console.firebase.google.com
2. iOS app ekle > `GoogleService-Info.plist` indir
3. Android app ekle > `google-services.json` indir
4. Dosyaları projeye ekle

---

### 13. Push Notification Test Et

**Expo Push Token Al:**
```bash
# Uygulamayı aç
# Console'da push token göreceksin
# Expo Push Notification Tool ile test et:
# https://expo.dev/notifications
```

---

## 📋 DEPLOYMENT CHECKLIST

### Hazırlık
- [ ] Convex dev çalıştırıldı (`npx convex dev`)
- [ ] Network monitoring yüklendi (opsiyonel)
- [ ] Sentry kuruldu ve yapılandırıldı
- [ ] `.env.production` oluşturuldu
- [ ] Convex production'a deploy edildi
- [ ] EAS hesabı oluşturuldu

### App Store Gereksinimleri
- [ ] Apple Developer hesabı ($99/yıl)
- [ ] Bundle ID kayıtlı: `com.kliq.app`
- [ ] Privacy Policy URL hazır
- [ ] Terms of Service URL hazır
- [ ] App screenshots hazır (3+ adet)
- [ ] App icon hazır (1024x1024)

### Google Play Gereksinimleri
- [ ] Google Play Developer hesabı ($25)
- [ ] Package name kayıtlı: `com.kliq.app`
- [ ] Privacy Policy URL hazır
- [ ] Terms of Service URL hazır
- [ ] App screenshots hazır (2+ adet)
- [ ] App icon hazır (512x512)

### Testing
- [ ] Beta testing yapıldı (1+ hafta)
- [ ] Feedback toplandı
- [ ] Critical bugs düzeltildi
- [ ] Push notifications test edildi

### Legal
- [ ] Privacy Policy avukat tarafından incelendi
- [ ] Terms of Service avukat tarafından incelendi
- [ ] KVKK uyumluluğu kontrol edildi

---

## 🚀 DEPLOYMENT ADIMLARI

### Adım 1: Build
```bash
# iOS
npm run build:ios

# Android
npm run build:android

# Her ikisi
npm run build:all
```

### Adım 2: Submit
```bash
# iOS
npm run submit:ios

# Android
npm run submit:android
```

### Adım 3: App Store Connect / Google Play Console

**iOS:**
1. App Store Connect'e gir
2. "My Apps" > Uygulamanız
3. "TestFlight" veya "App Store"
4. Build seç
5. Metadata doldur (açıklama, keywords, screenshots)
6. "Submit for Review"

**Android:**
1. Google Play Console'a gir
2. Uygulamanız > "Production"
3. "Create new release"
4. Build seç
5. Release notes yaz
6. "Review release" > "Start rollout to Production"

---

## ⏱️ TAHMİNİ SÜRELER

| Adım | Süre |
|------|------|
| Convex dev | 5 dakika |
| Paket kurulumları | 10 dakika |
| Environment setup | 15 dakika |
| Developer hesapları | 30 dakika |
| Privacy Policy yayınlama | 1 saat |
| Screenshots hazırlama | 2 saat |
| Beta testing | 1-2 hafta |
| App Store review | 1-3 gün |
| Google Play review | 1-7 gün |

**TOPLAM:** 2-4 hafta

---

## 💡 İPUÇLARI

1. **Acele Etmeyin** - Beta testing çok önemli
2. **Yedek Alın** - Her adımda git commit yapın
3. **Test Edin** - Her değişiklikten sonra test edin
4. **Dokümantasyon Okuyun** - Expo ve Convex docs çok iyi
5. **Yardım İsteyin** - Takıldığınız yerde sormaktan çekinmeyin

---

## 📞 YARDIM

### Dokümantasyon
- **Deployment:** [DEPLOYMENT.md](DEPLOYMENT.md)
- **Security:** [SECURITY.md](SECURITY.md)
- **Checklist:** [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)
- **Optional Packages:** [OPTIONAL_PACKAGES.md](OPTIONAL_PACKAGES.md)

### Kaynaklar
- Expo Docs: https://docs.expo.dev
- Convex Docs: https://docs.convex.dev
- EAS Build: https://docs.expo.dev/build/introduction/
- Sentry: https://docs.sentry.io/platforms/react-native/

---

**Başarılar! 🚀**

**Son Güncelleme:** 28 Ekim 2025

