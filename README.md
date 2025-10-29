# kliq - Restoran İçi İletişim Uygulaması

Restoran çalışanları için minimal ve hızlı bir mobil iletişim uygulaması.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/kliq)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Security](https://img.shields.io/badge/security-production%20ready-brightgreen.svg)](SECURITY.md)

## 🚀 Özellikler

- **Gerçek Zamanlı Mesajlaşma**: Convex'in reactive queries ile anlık mesajlaşma
- **Kanal Bazlı İletişim**: Genel, Mutfak, Servis ve Acil kanalları
- **Hızlı Mesajlar**: Önceden tanımlı mesaj şablonları ile hızlı iletişim
- **Rol Bazlı Sistem**: Yönetici, Garson, Mutfak ve Bar rolleri
- **Minimal UI**: Siyah-beyaz, modern ve kullanımı kolay arayüz
- **Offline-First**: AsyncStorage ile yerel veri saklama

## 🛠️ Teknolojiler

- **React Native** (Expo SDK 54)
- **Convex** - Backend ve gerçek zamanlı veritabanı
- **TypeScript** - Tip güvenliği
- **Expo Router** - Dosya bazlı navigasyon
- **AsyncStorage** - Yerel veri saklama

## 📦 Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Uygulamayı başlatın (tek komut!):
```bash
npm run dev
```

Bu komut hem Convex backend'i hem de Expo uygulamasını aynı anda başlatır.

### Alternatif: Ayrı Terminallerde
```bash
# Terminal 1
npx convex dev

# Terminal 2
npx expo start
```

## 🎯 Kullanım

### Restoran Oluşturma
1. Uygulamayı açın
2. "Oluştur" sekmesine geçin
3. Adınızı, email'inizi ve restoran adını girin
4. "Restoran Oluştur" butonuna tıklayın
5. Oluşturulan 6 haneli kodu ekip üyelerinizle paylaşın

### Restorana Katılma
1. Uygulamayı açın
2. "Katıl" sekmesinde kalın
3. Adınızı, email'inizi ve restoran kodunu girin
4. Rolünüzü seçin (Garson, Mutfak, Bar)
5. "Katıl" butonuna tıklayın

### Mesajlaşma
1. Ana ekranda bir kanal seçin
2. Mesaj yazın ve gönderin
3. Hızlı mesajlar için ⚡ butonuna tıklayın
4. Mesajlar gerçek zamanlı olarak güncellenir

## 📁 Proje Yapısı

```
kliq/
├── app/                    # Expo Router ekranları
│   ├── index.tsx          # Auth ekranı (Giriş/Kayıt)
│   ├── home.tsx           # Ana ekran (Kanal listesi)
│   ├── channel/[id].tsx   # Mesajlaşma ekranı
│   └── _layout.tsx        # Root layout (Convex Provider)
├── convex/                # Convex backend
│   ├── schema.ts          # Veritabanı şeması
│   ├── restaurants.ts     # Restoran fonksiyonları
│   ├── users.ts           # Kullanıcı fonksiyonları
│   ├── channels.ts        # Kanal fonksiyonları
│   ├── messages.ts        # Mesaj fonksiyonları
│   └── quickMessages.ts   # Hızlı mesaj fonksiyonları
└── package.json
```

## 🗄️ Veritabanı Şeması

### Tablolar
- **restaurants**: Restoran bilgileri ve katılım kodları
- **users**: Kullanıcı bilgileri ve rolleri
- **channels**: İletişim kanalları (Genel, Mutfak, Servis, Acil)
- **messages**: Mesajlar ve sipariş detayları
- **quickMessages**: Hızlı mesaj şablonları

## 🎨 Tasarım Kararları

- **Minimal UI**: Siyah arka plan, beyaz vurgular
- **Emoji İkonlar**: Her kanal için görsel tanımlayıcılar
- **Hızlı Erişim**: Tek dokunuşla hızlı mesaj gönderimi
- **Gerçek Zamanlı**: Convex'in reactive queries ile otomatik güncelleme

## 🔐 Güvenlik

**Production-Ready Güvenlik Özellikleri:**

- ✅ **Bcrypt Şifreleme** - Tüm şifreler güvenli hash ile saklanır
- ✅ **Rate Limiting** - API abuse ve brute force koruması
- ✅ **Input Validation** - Tüm kullanıcı girdileri doğrulanır
- ✅ **HTTPS Enforcement** - Production'da zorunlu şifreli bağlantı
- ✅ **Email Normalization** - Duplicate hesap önleme
- ✅ **Güçlü Şifre Politikası** - 8+ karakter, büyük/küçük harf, rakam
- ✅ **KVKK/GDPR Uyumlu** - Veri koruma yasalarına uygun

Detaylı güvenlik dokümantasyonu için: [SECURITY.md](SECURITY.md)

## 📱 Platform Desteği

- ✅ iOS 13.0+
- ✅ Android 8.0+ (API 26+)
- ✅ Web (Expo)

## 🚀 Production Deployment

Uygulamayı App Store ve Google Play'e yayınlamak için:

1. **Güvenlik Kontrolleri** - [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)
2. **Deployment Rehberi** - [DEPLOYMENT.md](DEPLOYMENT.md)
3. **Yasal Dökümanlar** - [PRIVACY_POLICY.md](PRIVACY_POLICY.md) & [TERMS_OF_SERVICE.md](TERMS_OF_SERVICE.md)

### Hızlı Başlangıç

```bash
# Production Convex deployment
npm run deploy:convex

# iOS build
npm run build:ios

# Android build
npm run build:android

# Her iki platform
npm run build:all
```

## 🚧 Gelecek Özellikler

- [x] Push bildirimleri ✅
- [x] Güvenli kimlik doğrulama ✅
- [x] Rate limiting ✅
- [ ] Two-factor authentication (2FA)
- [ ] Fotoğraf paylaşımı
- [ ] Sesli mesajlar
- [ ] End-to-end encryption
- [ ] Masa numarası entegrasyonu
- [ ] Sipariş takibi
- [ ] Analytics dashboard
