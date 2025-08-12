# Admin Yetki Sistemi Kurulum Rehberi

## 🚀 İlk Admin Kullanıcısını Oluşturma

### Firebase Console Üzerinden Manuel Ekleme:

1. **Firebase Console'a gidin**
   - https://console.firebase.google.com/
   - Projenizi seçin

2. **Firestore Database'e gidin**
   - Sol menüden "Firestore Database" seçin
   - "Data" sekmesine tıklayın

3. **Admins koleksiyonunu oluşturun**
   - "Start collection" butonuna tıklayın
   - Collection ID: `admins`
   - Document ID: Kullanıcının Firebase Auth UID'si

4. **Admin dokümanını oluşturun**
   ```json
   {
     "userId": "firebase_auth_uid_buraya",
     "role": "admin",
     "permissions": [
       "manage_users",
       "view_all_data", 
       "manage_orders",
       "send_recommendations",
       "answer_questions"
     ],
     "createdAt": "2024-01-01T00:00:00.000Z",
     "updatedAt": "2024-01-01T00:00:00.000Z"
   }
   ```

## 📋 Kullanıcı UID'sini Bulma

### Yöntem 1: Firebase Console
1. Authentication → Users sekmesi
2. Kullanıcıyı bulun
3. UID sütunundaki değeri kopyalayın

### Yöntem 2: Uygulama İçinden
1. Kullanıcı giriş yapsın
2. Browser Developer Tools → Console
3. `console.log(auth.currentUser.uid)` yazın

## 🎯 Rol ve İzin Sistemi

### Roller:
- **admin**: Sistem yöneticisi - tüm yetkiler
- **sponsor**: Sponsor - ekip yönetimi yetkisi

### İzinler:
- **manage_users**: Kullanıcı yönetimi
- **view_all_data**: Tüm verileri görme
- **manage_orders**: Sipariş yönetimi  
- **send_recommendations**: Ürün önerisi gönderme
- **answer_questions**: Soru yanıtlama

## 🔧 Sponsor Sistemi

### Sponsor Kodu Oluşturma:
```json
{
  "userId": "sponsor_user_id",
  "role": "sponsor", 
  "sponsorCode": "SPONSOR123",
  "parentSponsorId": "ust_sponsor_user_id",
  "permissions": [
    "send_recommendations",
    "answer_questions"
  ]
}
```

### Kayıt Linki:
```
https://yourapp.com/register?sponsor=SPONSOR123
```

## 🛡️ Güvenlik Kuralları

Firestore kuralları otomatik olarak:
- Kullanıcılar sadece kendi verilerine erişebilir
- Adminler tüm verilere erişebilir
- Sponsorlar alt ekip üyelerinin verilerine erişebilir

## 📊 Yetki Kontrolü

### Kod İçinde Kontrol:
```typescript
// Admin kontrolü
if (adminUser?.role === 'admin') {
  // Admin işlemleri
}

// Sponsor kontrolü  
if (adminUser?.role === 'sponsor') {
  // Sponsor işlemleri
}

// İzin kontrolü
if (adminUser?.permissions.includes('manage_users')) {
  // Kullanıcı yönetimi işlemleri
}
```

## 🔄 Sistem Akışı

1. **İlk Admin**: Firebase Console'dan manuel ekleme
2. **Diğer Adminler**: Admin panelinden ekleme
3. **Sponsorlar**: Admin tarafından sponsor rolü verme
4. **Kullanıcılar**: Sponsor kodu ile kayıt olma

## ⚠️ Önemli Notlar

- İlk admin mutlaka Firebase Console'dan eklenmelidir
- Admin rolü olan kullanıcılar diğer adminleri yönetebilir
- Sponsor kodları benzersiz olmalıdır
- Kullanıcı silme işlemi geri alınamaz

## 🆘 Sorun Giderme

### "Yetkisiz Erişim" Hatası:
1. Kullanıcının `admins` koleksiyonunda kaydı var mı?
2. `role` alanı doğru mu? ("admin" veya "sponsor")
3. Firestore kuralları güncel mi?

### Admin Paneli Görünmüyor:
1. Kullanıcı giriş yapmış mı?
2. `adminUser` context'te yüklendi mi?
3. Browser cache'i temizleyin

### İzin Hataları:
1. Firestore kuralları doğru mu?
2. Kullanıcının gerekli izinleri var mı?
3. Index'ler oluşturuldu mu?