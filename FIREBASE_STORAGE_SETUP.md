# Firebase Storage Kurulum Rehberi

## ⚠️ ACİL: CORS Hatası Çözümü

Eğer "CORS policy" hatası alıyorsanız, aşağıdaki adımları takip edin:

### 1. Firebase Console'da Storage Kuralları

1. [Firebase Console](https://console.firebase.google.com/) → Projenizi seçin
2. **Storage** → **Rules** sekmesi
3. Aşağıdaki kuralları kopyalayıp yapıştırın:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile photos - users can only upload/read their own photos
    match /profile-photos/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public read access for profile photos (for sharing)
    match /profile-photos/{userId}/{allPaths=**} {
      allow read: if true;
    }
    
    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### 2. CORS Yapılandırması

Firebase Storage için CORS yapılandırması gerekebilir. Google Cloud Console'da:

1. [Google Cloud Console](https://console.cloud.google.com/) → Projenizi seçin
2. **Cloud Storage** → **Browser**
3. Bucket'ınızı seçin
4. **Permissions** sekmesi → **CORS** yapılandırması

CORS JSON dosyası:
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization"]
  }
]
```

### 3. Firebase Storage Kuralları (Alternatif)

Daha basit kurallar:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Test Etme

1. Uygulamanızı yeniden başlatın
2. Profil sayfasına gidin
3. Fotoğraf yüklemeyi deneyin
4. Browser Console'da hata mesajlarını kontrol edin

### 5. Sorun Giderme

#### Hata: "CORS policy"
- Firebase Storage kurallarını kontrol edin
- Google Cloud Console'da CORS ayarlarını kontrol edin
- Projenin doğru yapılandırıldığından emin olun

#### Hata: "Permission denied"
- Storage kurallarının doğru olduğundan emin olun
- Kullanıcının giriş yapmış olduğunu kontrol edin
- Auth token'ının geçerli olduğunu kontrol edin

#### Hata: "File too large"
- Dosya boyutunu kontrol edin (max 5MB)
- Storage quota'nızı kontrol edin

### 6. Güvenlik Notları

- Profil fotoğrafları sadece ilgili kullanıcı tarafından yüklenebilir
- Dosya boyutu ve türü kontrolleri yapılır
- Eski fotoğraflar otomatik olarak silinir
- Firebase Storage güvenlik kuralları uygulanır

### 7. Production Ayarları

Production ortamında:
- CORS ayarlarını spesifik domain'ler için yapılandırın
- Storage kurallarını daha katı hale getirin
- Dosya boyutu limitlerini ayarlayın
- Monitoring ve logging ekleyin