# 🔐 Security Documentation - kliq

Bu doküman, kliq uygulamasında uygulanan güvenlik önlemlerini açıklar.

## 📋 İçindekiler

1. [Kimlik Doğrulama](#kimlik-doğrulama)
2. [Şifre Güvenliği](#şifre-güvenliği)
3. [Rate Limiting](#rate-limiting)
4. [Veri Güvenliği](#veri-güvenliği)
5. [Network Güvenliği](#network-güvenliği)
6. [Input Validation](#input-validation)
7. [Güvenlik En İyi Uygulamaları](#güvenlik-en-iyi-uygulamaları)

---

## 🔑 Kimlik Doğrulama

### Bcrypt ile Şifre Hash'leme

Tüm kullanıcı şifreleri **bcrypt** algoritması ile güvenli bir şekilde hash'lenir:

```typescript
// convex/auth.ts
const passwordHash = await bcrypt.hash(args.password, 10); // 10 salt rounds
```

**Özellikler:**
- ✅ Salt rounds: 10 (endüstri standardı)
- ✅ Rainbow table saldırılarına karşı korumalı
- ✅ Brute force saldırılarına karşı yavaş hash
- ✅ Her şifre için benzersiz salt

### Şifre Politikası

Güçlü şifre gereksinimleri:

```typescript
// Minimum 8 karakter
// En az 1 büyük harf (A-Z)
// En az 1 küçük harf (a-z)
// En az 1 rakam (0-9)
```

**Örnek Geçerli Şifreler:**
- ✅ `Kliq2025!`
- ✅ `MyPass123`
- ✅ `Secure99`

**Örnek Geçersiz Şifreler:**
- ❌ `password` (büyük harf ve rakam yok)
- ❌ `12345678` (harf yok)
- ❌ `Short1` (8 karakterden az)

---

## 🚦 Rate Limiting

API abuse ve brute force saldırılarını önlemek için rate limiting sistemi:

### Limitler

| Action | Max Attempts | Time Window |
|--------|--------------|-------------|
| Login | 5 | 15 dakika |
| Signup | 3 | 1 saat |
| Message | 100 | 1 dakika |
| Notification | 50 | 1 dakika |

### Nasıl Çalışır?

```typescript
// 1. Rate limit kontrolü
const rateLimit = await ctx.runQuery(internal.rateLimit.checkRateLimit, {
  identifier: email,
  action: "login",
});

// 2. Limit aşıldıysa reddet
if (!rateLimit.allowed) {
  return { error: "Çok fazla deneme..." };
}

// 3. Başarısız denemede kaydet
await ctx.runMutation(internal.rateLimit.recordAttempt, {
  identifier: email,
  action: "login",
});
```

### Otomatik Temizlik

Eski kayıtlar otomatik olarak temizlenir:
- Cron job ile günlük temizlik
- Maksimum window süresi geçmiş kayıtlar silinir

---

## 🔒 Veri Güvenliği

### Email Normalizasyonu

Tüm email adresleri normalize edilir:

```typescript
const identifier = args.email.toLowerCase().trim();
```

**Faydaları:**
- Duplicate hesap önleme
- Case-insensitive login
- Whitespace hatalarını önleme

### Input Sanitization

Tüm kullanıcı girdileri temizlenir:

```typescript
// İsim temizleme
name: args.name.trim()

// Email validasyonu
if (!isValidEmail(args.email)) {
  return { error: "Geçersiz email" };
}
```

### Veri Şifreleme

- ✅ Şifreler: bcrypt hash
- ✅ Network: HTTPS (production)
- ✅ Storage: Encrypted AsyncStorage (önerilir)

---

## 🌐 Network Güvenliği

### HTTPS Zorunluluğu

Production ortamında HTTPS zorunludur:

```typescript
// app/_layout.tsx
if (CONVEX_URL && !CONVEX_URL.startsWith("https://") && isProduction) {
  throw new Error("Production build requires HTTPS Convex URL");
}
```

### Environment Validation

Environment variables production'da kontrol edilir:

```typescript
if (!CONVEX_URL && isProduction) {
  throw new Error("Production build requires EXPO_PUBLIC_CONVEX_URL");
}
```

---

## ✅ Input Validation

### Email Validation

```typescript
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

### Password Validation

```typescript
function validatePassword(password: string) {
  if (password.length < 8) return { valid: false };
  if (!/[A-Z]/.test(password)) return { valid: false };
  if (!/[a-z]/.test(password)) return { valid: false };
  if (!/[0-9]/.test(password)) return { valid: false };
  return { valid: true };
}
```

### Name Validation

```typescript
if (!args.name || args.name.trim().length < 2) {
  return { error: "İsim en az 2 karakter olmalıdır" };
}
```

---

## 🛡️ Güvenlik En İyi Uygulamaları

### 1. Şifre Yönetimi

**YAPILMASI GEREKENLER:**
- ✅ Bcrypt kullan (salt rounds: 10+)
- ✅ Güçlü şifre politikası uygula
- ✅ Şifreleri asla plain text sakla
- ✅ Şifreleri asla loglama

**YAPILMAMASI GEREKENLER:**
- ❌ MD5 veya SHA1 kullanma
- ❌ Basit hash fonksiyonları
- ❌ Şifreleri email ile gönderme
- ❌ Şifreleri URL'de taşıma

### 2. Session Yönetimi

**Öneriler:**
- Secure session tokens kullan
- Session timeout uygula
- Logout sonrası token'ları invalidate et
- Multiple device desteği için token yönetimi

### 3. API Güvenliği

**Uygulanmış:**
- ✅ Rate limiting
- ✅ Input validation
- ✅ HTTPS enforcement
- ✅ Error handling

**Önerilen İyileştirmeler:**
- [ ] API key rotation
- [ ] Request signing
- [ ] IP whitelisting (admin için)
- [ ] CORS configuration

### 4. Veri Koruma

**KVKK/GDPR Uyumluluğu:**
- ✅ Privacy Policy
- ✅ Terms of Service
- ✅ User consent
- ✅ Data deletion (hesap silme)
- ✅ Data export (kullanıcı verileri)

### 5. Monitoring & Logging

**Önerilen:**
- Error tracking (Sentry)
- Security event logging
- Failed login attempts monitoring
- Suspicious activity alerts

---

## 🚨 Güvenlik Olayı Müdahale Planı

### 1. Şüpheli Aktivite Tespit

**İndikatörler:**
- Çok sayıda başarısız login denemesi
- Anormal API kullanımı
- Beklenmeyen veri erişimi

**Aksiyon:**
1. Rate limiting devreye girer
2. Kullanıcı hesabı geçici olarak kilitlenir
3. Admin bilgilendirilir
4. Log kayıtları incelenir

### 2. Veri İhlali

**Acil Durum Prosedürü:**
1. Sistemi izole et
2. Etkilenen kullanıcıları belirle
3. Kullanıcıları bilgilendir
4. Şifre resetleme zorunlu kıl
5. Güvenlik açığını kapat
6. Yasal bildirimleri yap (KVKK)

### 3. DDoS Saldırısı

**Koruma:**
- Convex built-in DDoS protection
- Rate limiting
- CDN kullanımı (web için)

---

## 📞 Güvenlik Bildirimi

Güvenlik açığı bulursanız:

**E-posta:** security@kliq.app
**Beklenen Yanıt Süresi:** 24 saat

**Lütfen şunları belirtin:**
- Açığın detaylı açıklaması
- Reproduce adımları
- Potansiyel etki
- Önerilen çözüm (varsa)

---

## 🔄 Güvenlik Güncellemeleri

### Versiyon 1.0.0 (Mevcut)

- ✅ Bcrypt şifreleme
- ✅ Rate limiting
- ✅ Input validation
- ✅ HTTPS enforcement
- ✅ Email normalization

### Planlanan İyileştirmeler

- [ ] Two-factor authentication (2FA)
- [ ] Biometric authentication
- [ ] End-to-end encryption (mesajlar için)
- [ ] Security headers
- [ ] Content Security Policy

---

## 📚 Kaynaklar

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)
- [KVKK Mevzuatı](https://kvkk.gov.tr/)
- [GDPR Guidelines](https://gdpr.eu/)

---

**Son Güncelleme:** 28 Ekim 2025
**Güvenlik Seviyesi:** Production Ready ✅

