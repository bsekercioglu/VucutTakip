# Güvenlik Rehberi

## Önemli Güvenlik Notları

### 1. Environment Variables
- `.env` dosyası asla Git'e commit edilmemelidir
- Production'da environment variables kullanın
- API anahtarlarını kod içinde hardcode etmeyin

### 2. Firebase Güvenliği
- Firebase Security Rules'ları doğru yapılandırın
- Authentication zorunlu kılın
- Firestore'da user-based access control uygulayın

### 3. Deployment Güvenliği
- Production build'de debug modunu kapatın
- HTTPS kullanın
- CORS ayarlarını doğru yapılandırın

### 4. Kod Güvenliği
- Kullanıcı girdilerini validate edin
- XSS saldırılarına karşı korunun
- Sensitive data'yı client-side'da saklamayın

## Güvenli Deployment

1. Environment variables'ları hosting platformunda ayarlayın
2. Firebase Security Rules'ları test edin
3. HTTPS sertifikası kullanın
4. Regular security updates yapın