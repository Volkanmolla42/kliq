# 🚀 EAS BUILD REHBERİ

Bu dosya, kliq uygulamasını iOS ve Android için build etme adımlarını içerir.

---

## 📋 ÖN HAZIRLIK

### 1. Gerekli Hesaplar

#### Expo Hesabı
```bash
# Expo hesabı oluşturun (ücretsiz)
https://expo.dev/signup

# Giriş yapın
eas login
```

#### Apple Developer Hesabı (iOS için)
- **Maliyet:** $99/yıl
- **Link:** https://developer.apple.com/programs/
- **Gerekli Bilgiler:**
  - Apple ID
  - Team ID
  - Bundle Identifier: `com.kliq.app`

#### Google Play Developer Hesabı (Android için)
- **Maliyet:** $25 (tek seferlik)
- **Link:** https://play.google.com/console/signup
- **Gerekli Bilgiler:**
  - Google hesabı
  - Package Name: `com.kliq.app`

---

## 🔧 KURULUM

### 1. EAS CLI Kurulumu

```bash
# Global olarak kur (✅ YAPILDI)
npm install -g eas-cli

# Giriş yap
eas login
```

### 2. Proje Yapılandırması

```bash
# EAS projesini yapılandır
eas build:configure
```

Bu komut:
- ✅ `eas.json` dosyasını oluşturur (zaten var)
- ✅ Expo hesabınızla projeyi ilişkilendirir
- ✅ iOS ve Android yapılandırmalarını hazırlar

---

## 📱 iOS BUILD

### Adım 1: Apple Developer Hesabı Hazırlığı

1. **App Store Connect'e giriş yapın:**
   - https://appstoreconnect.apple.com

2. **Yeni uygulama oluşturun:**
   - Bundle ID: `com.kliq.app`
   - App Name: `kliq`
   - Primary Language: Turkish

3. **Certificates & Identifiers:**
   - Otomatik olarak EAS tarafından oluşturulacak

### Adım 2: iOS Build Başlat

```bash
# Development build (test için)
eas build --platform ios --profile development

# Preview build (internal testing)
eas build --platform ios --profile preview

# Production build (App Store)
eas build --platform ios --profile production
```

### Adım 3: Build Takibi

```bash
# Build durumunu kontrol et
eas build:list

# Build loglarını görüntüle
eas build:view [BUILD_ID]
```

### Adım 4: TestFlight'a Yükleme

```bash
# Otomatik submit (eas.json'da yapılandırılmış)
eas submit --platform ios --profile production

# Manuel submit
# 1. Build tamamlandığında .ipa dosyasını indir
# 2. Transporter uygulamasını kullan
# 3. App Store Connect'te submit et
```

---

## 🤖 ANDROID BUILD

### Adım 1: Google Play Console Hazırlığı

1. **Google Play Console'a giriş yapın:**
   - https://play.google.com/console

2. **Yeni uygulama oluşturun:**
   - App Name: `kliq`
   - Default Language: Turkish
   - App Type: App
   - Free/Paid: Free

3. **Package Name:**
   - `com.kliq.app`

### Adım 2: Keystore Oluşturma

```bash
# EAS otomatik olarak keystore oluşturur
# Manuel oluşturmak isterseniz:
eas credentials
```

### Adım 3: Android Build Başlat

```bash
# Development build (test için)
eas build --platform android --profile development

# Preview build (internal testing)
eas build --platform android --profile preview

# Production build (Google Play - APK)
eas build --platform android --profile production

# Production build (Google Play - AAB - ÖNERİLİR)
# eas.json'da buildType: "apk" yerine "aab" kullanın
```

### Adım 4: Google Play'e Yükleme

```bash
# Otomatik submit
eas submit --platform android --profile production

# Manuel submit
# 1. Build tamamlandığında .apk veya .aab dosyasını indir
# 2. Google Play Console'da "Release" > "Production" > "Create new release"
# 3. APK/AAB dosyasını yükle
```

---

## 🔄 HER İKİ PLATFORM İÇİN BUILD

```bash
# Development
eas build --platform all --profile development

# Preview
eas build --platform all --profile preview

# Production
eas build --platform all --profile production
```

---

## 📊 BUILD PROFİLLERİ

### Development Profile
- **Amaç:** Geliştirme ve test
- **Distribution:** Internal
- **Convex URL:** Dev deployment (agile-kingfisher-675)
- **Kullanım:** Expo Go veya development client

### Preview Profile
- **Amaç:** Internal testing (beta)
- **Distribution:** Internal
- **Convex URL:** Dev deployment (agile-kingfisher-675)
- **Kullanım:** TestFlight (iOS) / Internal Testing (Android)

### Production Profile
- **Amaç:** App Store / Google Play yayını
- **Distribution:** Store
- **Convex URL:** Production deployment (focused-sheep-771)
- **Kullanım:** Public release

---

## 🔐 GÜVENLİK

### Environment Variables

**Development & Preview:**
```
EXPO_PUBLIC_CONVEX_URL=https://agile-kingfisher-675.convex.cloud
NODE_ENV=development/staging
```

**Production:**
```
EXPO_PUBLIC_CONVEX_URL=https://focused-sheep-771.convex.cloud
NODE_ENV=production
EXPO_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### Secrets Yönetimi

```bash
# Secret ekle
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "your-dsn"

# Secret listele
eas secret:list

# Secret sil
eas secret:delete --name EXPO_PUBLIC_SENTRY_DSN
```

---

## 📝 BUILD SONRASI

### iOS

1. **TestFlight Beta Testing:**
   - App Store Connect > TestFlight
   - Internal testers ekle
   - External testers için Apple review gerekli

2. **App Store Submission:**
   - App Store Connect > App Store
   - Screenshots ekle (6.7", 5.5")
   - App description (TR/EN)
   - Privacy Policy URL
   - Submit for Review

### Android

1. **Internal Testing:**
   - Google Play Console > Testing > Internal testing
   - Testers ekle (email ile)
   - Release oluştur

2. **Production Release:**
   - Google Play Console > Production
   - Screenshots ekle (1080x1920)
   - App description (TR/EN)
   - Privacy Policy URL
   - Submit for Review

---

## 🐛 SORUN GİDERME

### Build Hataları

```bash
# Build loglarını görüntüle
eas build:view [BUILD_ID]

# Credentials sorunları
eas credentials

# Cache temizle
eas build --clear-cache
```

### Yaygın Hatalar

1. **"Bundle identifier already exists"**
   - `app.config.js`'de `ios.bundleIdentifier` değiştirin

2. **"Package name already exists"**
   - `app.config.js`'de `android.package` değiştirin

3. **"Invalid credentials"**
   - `eas credentials` ile yeniden yapılandırın

4. **"Build timeout"**
   - Daha güçlü build worker kullanın (ücretli)

---

## 💰 MALİYETLER

### Expo EAS Build

- **Free Tier:**
  - iOS: 30 build/ay
  - Android: 30 build/ay
  
- **Production Tier ($29/ay):**
  - iOS: Unlimited
  - Android: Unlimited
  - Priority builds
  - Faster workers

### App Store

- **Apple Developer:** $99/yıl
- **Google Play:** $25 (tek seferlik)

**TOPLAM İLK YIL:** $124

---

## 📞 YARDIM

- **EAS Docs:** https://docs.expo.dev/build/introduction/
- **Expo Forums:** https://forums.expo.dev/
- **Discord:** https://chat.expo.dev/

---

## ✅ KONTROL LİSTESİ

### iOS
- [ ] Apple Developer hesabı oluşturuldu
- [ ] App Store Connect'te uygulama oluşturuldu
- [ ] Bundle ID yapılandırıldı (`com.kliq.app`)
- [ ] EAS build başlatıldı
- [ ] TestFlight'a yüklendi
- [ ] Beta testing tamamlandı
- [ ] Screenshots hazırlandı
- [ ] App Store'a submit edildi

### Android
- [ ] Google Play Developer hesabı oluşturuldu
- [ ] Google Play Console'da uygulama oluşturuldu
- [ ] Package name yapılandırıldı (`com.kliq.app`)
- [ ] EAS build başlatıldı
- [ ] Internal testing başlatıldı
- [ ] Beta testing tamamlandı
- [ ] Screenshots hazırlandı
- [ ] Google Play'e submit edildi

---

**🎉 Başarılar! Build sürecinde sorularınız olursa dokümantasyona bakın.**

