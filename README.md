# VücutTakip - Sağlık ve Vücut Takip Uygulaması 🏃‍♂️

Modern ve kullanıcı dostu bir vücut takip uygulaması. React, TypeScript ve Firebase ile geliştirilmiştir. 🚀

## Özellikler

- 📊 **Günlük Ölçüm Takibi**: Ağırlık, yağ oranı, su oranı ve kas oranı takibi
- 📈 **Gelişim Grafikleri**: Detaylı grafikler ile ilerleme analizi
- 👨‍⚕️ **Uzman Danışmanlık**: Profesyonel danışmanlardan destek alma
- 🛒 **Ürün Önerileri**: Hedeflerinize uygun ürün tavsiyeleri
- 👤 **Kişisel Profil**: Detaylı profil yönetimi ve vücut ölçümleri
- 📱 **Responsive Tasarım**: Tüm cihazlarda mükemmel görünüm

## 🛠️ Teknolojiler

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Grafikler**: Recharts
- **Form Yönetimi**: React Hook Form
- **Routing**: React Router DOM
- **İkonlar**: Lucide React

## Kurulum

1. Projeyi klonlayın:
```bash
git clone <repository-url>
cd vucuttakip
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Environment değişkenlerini ayarlayın:
   - `env.example` dosyasını `.env` olarak kopyalayın
   - Firebase yapılandırma bilgilerini güncelleyin
   - Debug modu için `VITE_DEBUG_LOG=true` ayarlayın (development için)

4. Firebase yapılandırmasını ayarlayın:
   - Firebase Console'da yeni bir proje oluşturun
   - Authentication, Firestore ve Storage servislerini etkinleştirin
   - Firestore güvenlik kurallarını `firestore.rules` dosyasından deploy edin

5. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

## Firebase Yapılandırması

### Authentication
- Email/Password authentication etkinleştirilmeli
- Google ve Facebook providers (isteğe bağlı)

### Firestore Database
Aşağıdaki koleksiyonlar oluşturulmalı:
- `users`: Kullanıcı profil bilgileri
- `dailyRecords`: Günlük ölçüm kayıtları
- `questions`: Danışman soruları
- `admins`: Admin kullanıcıları
- `sponsorTeams`: Sponsor takımları
- `orders`: Siparişler
- `productRecommendations`: Ürün önerileri
- `sponsorMessages`: Sponsor mesajları

### Storage
- Profil fotoğrafları için kullanılır

### Güvenlik Kuralları
- `firestore.rules` dosyasındaki güvenlik kuralları deploy edilmelidir
- Admin yetkisi kontrolü otomatik olarak yapılır

## 🚀 Kullanım Rehberi

1. **Kayıt Olma**: Üç adımlı kayıt süreci ile hesap oluşturun
2. **Giriş Yapma**: Email/şifre veya sosyal medya ile giriş yapın
3. **Ölçüm Ekleme**: Günlük ölçümlerinizi kaydedin
4. **İlerleme Takibi**: Dashboard'da gelişiminizi izleyin
5. **Danışman Desteği**: Uzmanlardan yardım alın

## Proje Yapısı

```
src/
├── components/          # Yeniden kullanılabilir bileşenler
├── contexts/           # React Context providers
├── pages/              # Sayfa bileşenleri
├── services/           # Firebase servisleri
├── utils/              # Yardımcı fonksiyonlar
├── config/             # Yapılandırma dosyaları
│   ├── firebase.ts     # Firebase yapılandırması
│   └── appConfig.ts    # Uygulama ayarları ve debug modu
├── hooks/              # Custom React hooks
└── types/              # TypeScript tip tanımları
```

## Debug Modu

Proje debug modu ile çalışır. Debug logları sadece development ortamında ve `VITE_DEBUG_LOG=true` ayarlandığında görünür:

```bash
# Development için debug modunu etkinleştir
VITE_DEBUG_LOG=true

# Production için debug modunu devre dışı bırak
VITE_DEBUG_LOG=false
```

## Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## İletişim

Sorularınız için: info@vucuttakip.com

## Demo

Canlı demo: [https://sparkling-kataifi-615fc6.netlify.app](https://sparkling-kataifi-615fc6.netlify.app)

Demo hesap bilgileri:
- Email: demo@vucuttakip.com
- Şifre: demo123