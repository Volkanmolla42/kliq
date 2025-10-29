# Changelog - kliq

Tüm önemli değişiklikler bu dosyada belgelenir.

## [1.0.0] - 2025-10-28 - Production Ready Release 🚀

### 🔐 Güvenlik İyileştirmeleri (CRITICAL)

#### Şifre Güvenliği
- ✅ **Bcrypt implementasyonu** - Basit hash fonksiyonu yerine bcrypt kullanımı
  - Salt rounds: 10
  - Rainbow table saldırılarına karşı korumalı
  - Brute force saldırılarına karşı yavaş hash
- ✅ **Güçlü şifre politikası**
  - Minimum 8 karakter (önceden 6)
  - En az 1 büyük harf zorunlu
  - En az 1 küçük harf zorunlu
  - En az 1 rakam zorunlu
- ✅ **Action-based authentication** - Mutation yerine action kullanımı
  - Node.js runtime'da bcrypt desteği
  - Daha güvenli şifre işleme

#### Rate Limiting
- ✅ **Rate limiting sistemi** - API abuse önleme
  - Login: 5 deneme / 15 dakika
  - Signup: 3 deneme / 1 saat
  - Message: 100 mesaj / 1 dakika
  - Notification: 50 bildirim / 1 dakika
- ✅ **Otomatik temizlik** - Eski rate limit kayıtları temizlenir
- ✅ **Kullanıcı dostu hata mesajları** - Reset zamanı gösterimi

#### Input Validation
- ✅ **Email validasyonu** - Regex ile email kontrolü
- ✅ **Email normalizasyonu** - Lowercase + trim
- ✅ **Name validasyonu** - Minimum 2 karakter
- ✅ **Password validasyonu** - Güçlü şifre kontrolü

### 📱 App Store Yapılandırması

#### iOS Configuration
- ✅ **Bundle Identifier** - `com.kliq.app`
- ✅ **Build Number** - `1`
- ✅ **Info.plist permissions**
  - Camera usage description
  - Photo library usage description
  - Microphone usage description

#### Android Configuration
- ✅ **Package Name** - `com.kliq.app`
- ✅ **Version Code** - `1`
- ✅ **Permissions**
  - CAMERA
  - READ_EXTERNAL_STORAGE
  - WRITE_EXTERNAL_STORAGE
  - RECORD_AUDIO
  - NOTIFICATIONS

#### App Metadata
- ✅ **App açıklamaları** (TR/EN)
- ✅ **Keywords** belirlendi
- ✅ **Privacy Policy** hazırlandı
- ✅ **Terms of Service** hazırlandı

### 🏗️ Production Environment

#### Environment Variables
- ✅ **`.env.example`** - Örnek environment dosyası
- ✅ **Environment validation** - Production'da HTTPS kontrolü
- ✅ **Fallback handling** - Development için localhost
- ✅ **Error screens** - Configuration hataları için

#### Build Configuration
- ✅ **EAS Build yapılandırması** - `eas.json`
- ✅ **Build profiles**
  - Development
  - Preview
  - Production
- ✅ **Submit configuration** - iOS ve Android

#### Scripts
- ✅ **Build scripts** - `npm run build:ios`, `build:android`, `build:all`
- ✅ **Submit scripts** - `npm run submit:ios`, `submit:android`
- ✅ **Deploy script** - `npm run deploy:convex`
- ✅ **Preview scripts** - `npm run preview:ios`, `preview:android`

### 📄 Dokümantasyon

#### Yeni Dosyalar
- ✅ **DEPLOYMENT.md** - Detaylı deployment rehberi
- ✅ **PRODUCTION_CHECKLIST.md** - Production checklist
- ✅ **SECURITY.md** - Güvenlik dokümantasyonu
- ✅ **PRIVACY_POLICY.md** - Gizlilik politikası (TR)
- ✅ **TERMS_OF_SERVICE.md** - Kullanım şartları (TR)
- ✅ **APP_STORE_DESCRIPTION.md** - App Store açıklamaları (TR/EN)
- ✅ **CHANGELOG.md** - Bu dosya

#### Güncellemeler
- ✅ **README.md** - Güvenlik ve deployment bölümleri eklendi
- ✅ **package.json** - Production scripts eklendi

### 🗄️ Database Schema

#### Yeni Tablolar
- ✅ **rateLimits** - Rate limiting kayıtları
  - identifier (user ID veya IP)
  - action (login, signup, message, notification)
  - timestamp
  - Indexes: by_identifier_and_action, by_timestamp

### 🔧 Code Quality

#### Lint Fixes
- ✅ **Array type syntax** - `Array<T>` → `T[]`
- ✅ **Unused variables** - Temizlendi
- ✅ **Import optimization** - useAction kullanımı

#### Type Safety
- ✅ **Strict typing** - Tüm fonksiyonlar tip güvenli
- ✅ **Validator updates** - Convex validators güncellendi
- ✅ **Return types** - Tüm return types tanımlı

### 🎨 UI/UX İyileştirmeleri

#### Error Handling
- ✅ **Configuration error screen** - Production hataları için
- ✅ **Rate limit messages** - Kullanıcı dostu mesajlar
- ✅ **Validation feedback** - Anlaşılır hata mesajları

### 📦 Dependencies

#### Yeni Paketler
- ✅ **bcryptjs** - Şifre hash'leme
- ✅ **@types/bcryptjs** - TypeScript tipleri

### 🔄 Breaking Changes

#### Authentication
- ⚠️ **Action-based auth** - `useMutation` → `useAction`
  - Frontend'de `useAction` kullanımı gerekli
  - Eski şifreler geçersiz (bcrypt hash gerekli)
  - Kullanıcıların yeniden kayıt olması gerekebilir

#### Password Policy
- ⚠️ **Güçlü şifre zorunluluğu**
  - Eski 6 karakterlik şifreler artık geçersiz
  - Minimum 8 karakter + büyük/küçük harf + rakam

### 📊 Performance

#### Optimizations
- ✅ **Rate limit caching** - Veritabanı sorguları optimize edildi
- ✅ **Email normalization** - Duplicate sorguları önlendi
- ✅ **Index optimization** - Yeni indexler eklendi

### 🧪 Testing

#### Test Coverage
- [ ] Unit tests (TODO)
- [ ] Integration tests (TODO)
- [ ] E2E tests (TODO)
- [ ] Security tests (TODO)

### 🚀 Deployment

#### Ready for Production
- ✅ Güvenlik kontrolleri tamamlandı
- ✅ App Store yapılandırması hazır
- ✅ Dokümantasyon tamamlandı
- ✅ Environment variables ayarlandı
- ⚠️ Beta testing gerekli
- ⚠️ Legal review önerilir

### 📝 Notes

#### Önemli Notlar
1. **Bcrypt Migration**: Mevcut kullanıcılar yeniden kayıt olmalı
2. **Environment Setup**: Production deployment öncesi `.env.production` oluşturulmalı
3. **Legal Review**: Privacy Policy ve Terms yasal danışman ile gözden geçirilmeli
4. **Beta Testing**: En az 10 kullanıcı ile test edilmeli
5. **Monitoring**: Production'da error tracking kurulmalı (Sentry önerilir)

#### Sonraki Adımlar
1. Beta testing başlat
2. Feedback topla
3. Critical bugs düzelt
4. Legal review yap
5. App Store'a submit et

---

## [0.1.0] - 2025-10-XX - Initial Development

### Features
- ✅ Temel mesajlaşma sistemi
- ✅ Kanal bazlı iletişim
- ✅ Restoran yönetimi
- ✅ Kullanıcı rolleri
- ✅ Push notifications
- ✅ Offline support

### Known Issues
- ⚠️ Basit şifre hash'leme (güvenli değil)
- ⚠️ Rate limiting yok
- ⚠️ Input validation eksik
- ⚠️ Production yapılandırması yok

---

**Format:** [Semantic Versioning](https://semver.org/)
**Changelog Format:** [Keep a Changelog](https://keepachangelog.com/)

