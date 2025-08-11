# Facebook Login Kurulum Rehberi

## 🔧 Firebase Console Ayarları

### 1. Firebase Console'da Facebook Authentication'ı Etkinleştirin

1. [Firebase Console](https://console.firebase.google.com/) → Projenizi seçin
2. **Authentication** → **Sign-in method** sekmesine gidin
3. **Facebook** seçeneğini bulun ve **Enable** edin
4. **App ID** ve **App Secret** alanları görünecek (şimdilik boş bırakın)

### 2. Facebook Developer Console'da Uygulama Oluşturun

1. [Facebook Developers](https://developers.facebook.com/) adresine gidin
2. **My Apps** → **Create App** tıklayın
3. **Consumer** seçeneğini seçin
4. Uygulama adını girin (örn: "VücutTakip")
5. İletişim e-postanızı girin
6. **Create App** tıklayın

### 3. Facebook Login Ürününü Ekleyin

1. Dashboard'da **Add Product** bölümünden **Facebook Login** seçin
2. **Set Up** butonuna tıklayın
3. **Web** platformunu seçin
4. Site URL'nizi girin:
   - Development: `http://localhost:5173`
   - Production: `https://sparkling-kataifi-615fc6.netlify.app`

### 4. Facebook App Ayarları

1. **Settings** → **Basic** sekmesine gidin
2. **App ID** ve **App Secret** değerlerini kopyalayın
3. **App Domains** alanına domain'inizi ekleyin:
   - `localhost` (development için)
   - `sparkling-kataifi-615fc6.netlify.app` (production için)

### 5. Facebook Login Ayarları

1. **Facebook Login** → **Settings** sekmesine gidin
2. **Valid OAuth Redirect URIs** alanına şunları ekleyin:
   ```
   https://fir-logindbapp.firebaseapp.com/__/auth/handler
   http://localhost:5173
   https://sparkling-kataifi-615fc6.netlify.app
   ```

### 6. Firebase'e Facebook Bilgilerini Ekleyin

1. Firebase Console → Authentication → Sign-in method → Facebook
2. **App ID** ve **App Secret** değerlerini yapıştırın
3. **OAuth redirect URI**'yi kopyalayın
4. Facebook Developer Console'da bu URI'yi **Valid OAuth Redirect URIs** listesine ekleyin
5. Firebase'de **Save** butonuna tıklayın

### 7. Facebook App'i Canlıya Alın

1. Facebook Developer Console → **App Review** sekmesi
2. **Make [App Name] public?** sorusuna **Yes** deyin
3. Uygulamanız artık herkese açık

## 🔒 Güvenlik Ayarları

### Facebook App Permissions
Uygulama şu izinleri kullanır:
- `email` - E-posta adresini almak için
- `public_profile` - Ad, soyad ve profil fotoğrafı için

### Firebase Security Rules
Mevcut Firestore kuralları Facebook login'i destekler.

## 🧪 Test Etme

### Development'da Test
1. `npm run dev` ile uygulamayı başlatın
2. Register/Login sayfasında Facebook butonunu test edin

### Production'da Test
1. Netlify'da yayınlanan siteyi ziyaret edin
2. Facebook login'i test edin

## ⚠️ Önemli Notlar

1. **Facebook App Review**: Bazı gelişmiş izinler için Facebook'un onayı gerekebilir
2. **HTTPS Gereksinimi**: Production'da HTTPS zorunlu
3. **Domain Doğrulama**: Facebook, domain'leri doğrular
4. **Rate Limiting**: Facebook API'sinin rate limit'leri vardır

## 🐛 Sorun Giderme

### Yaygın Hatalar:

**"Given URL is not allowed by the Application configuration"**
- Facebook Developer Console'da Valid OAuth Redirect URIs'leri kontrol edin

**"App Not Setup: This app is still in development mode"**
- Facebook App'i public yapın (App Review → Make Public)

**"Invalid Scopes"**
- İstenen izinlerin (email, public_profile) Facebook'ta onaylandığından emin olun

**Popup Blocked**
- Kullanıcıdan popup engelleyiciyi devre dışı bırakmasını isteyin

## 📞 Destek

Sorun yaşarsanız:
1. Firebase Console'da Authentication logs'ları kontrol edin
2. Browser Developer Tools'da console hatalarını inceleyin
3. Facebook Developer Console'da App Events'leri kontrol edin