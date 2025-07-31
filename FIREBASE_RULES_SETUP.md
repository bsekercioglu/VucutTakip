# Firebase Firestore Security Rules Kurulum Rehberi

## 1. Firebase Console'a Giriş

1. [Firebase Console](https://console.firebase.google.com/) adresine gidin
2. Projenizi seçin
3. Sol menüden **Firestore Database** seçeneğine tıklayın

## 2. Security Rules Sayfasına Gitme

1. Firestore Database sayfasında üst menüden **Rules** sekmesine tıklayın
2. Mevcut kuralları göreceksiniz

## 3. Yeni Kuralları Ekleme

Aşağıdaki kuralları kopyalayıp Firebase Console'daki rules editörüne yapıştırın:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Daily records - users can only access their own records
    match /dailyRecords/{recordId} {
      allow read, write: if request.auth != null && 
        (resource == null || resource.data.userId == request.auth.uid) &&
        (request.resource == null || request.resource.data.userId == request.auth.uid);
    }
    
    // Daily tracking - users can only access their own tracking data
    match /dailyTracking/{trackingId} {
      allow read, write: if request.auth != null && 
        (resource == null || resource.data.userId == request.auth.uid) &&
        (request.resource == null || request.resource.data.userId == request.auth.uid);
    }
    
    // Questions - users can only access their own questions
    match /questions/{questionId} {
      allow read, write: if request.auth != null && 
        (resource == null || resource.data.userId == request.auth.uid) &&
        (request.resource == null || request.resource.data.userId == request.auth.uid);
    }
    
    // Admin access for consultants (optional - for future use)
    match /questions/{questionId} {
      allow read, update: if request.auth != null && 
        exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
  }
}
```

## 4. Kuralları Yayınlama

1. Kuralları yapıştırdıktan sonra **Publish** butonuna tıklayın
2. Değişikliklerin uygulanması için birkaç saniye bekleyin
3. "Rules published successfully" mesajını göreceksiniz

## 5. Composite Indexes Oluşturma

Bazı sorgular için composite index'ler gereklidir. Aşağıdaki adımları takip edin:

### 5.1 Indexes Sayfasına Gitme
1. Firestore Database sayfasında üst menüden **Indexes** sekmesine tıklayın

### 5.2 Gerekli Index'leri Oluşturma

Aşağıdaki index'leri tek tek oluşturun:

#### Index 1: dailyRecords için
- **Create Index** butonuna tıklayın
- Collection ID: `dailyRecords`
- Field 1: `userId` (Ascending)
- Field 2: `date` (Ascending)
- **Create** butonuna tıklayın

#### Index 2: dailyTracking için
- **Create Index** butonuna tıklayın
- Collection ID: `dailyTracking`
- Field 1: `userId` (Ascending)
- Field 2: `date` (Descending)
- **Create** butonuna tıklayın

#### Index 3: questions için
- **Create Index** butonuna tıklayın
- Collection ID: `questions`
- Field 1: `userId` (Ascending)
- Field 2: `timestamp` (Descending)
- **Create** butonuna tıklayın

## 6. Index Durumunu Kontrol Etme

1. Index'ler oluşturulduktan sonra **Building** durumunda olacaklar
2. Birkaç dakika içinde **Enabled** durumuna geçecekler
3. Tüm index'ler **Enabled** olduğunda uygulama tam olarak çalışacak

## 7. Test Etme

1. Uygulamanızı yeniden başlatın
2. Kullanıcı kaydı oluşturmayı deneyin
3. Günlük ölçüm eklemeyi deneyin
4. Danışman sayfasından soru göndermeyi deneyin

## 8. Sorun Giderme

### Hata: "Missing or insufficient permissions"
- Security rules'ların doğru uygulandığından emin olun
- Kullanıcının giriş yapmış olduğunu kontrol edin

### Hata: "The query requires an index"
- Gerekli composite index'lerin oluşturulduğunu kontrol edin
- Index'lerin **Enabled** durumda olduğunu kontrol edin

### Hata: "Operation not allowed"
- Authentication ayarlarının doğru yapılandırıldığını kontrol edin
- Email/Password authentication'ın etkin olduğunu kontrol edin

## 9. Güvenlik Notları

- Bu kurallar kullanıcıların sadece kendi verilerine erişmesini sağlar
- Admin erişimi için ayrı bir `admins` koleksiyonu kullanılabilir
- Production ortamında daha katı kurallar uygulanabilir

## 10. Yedekleme

Mevcut kurallarınızı değiştirmeden önce:
1. Mevcut kuralları kopyalayıp bir yere kaydedin
2. Böylece gerektiğinde geri dönebilirsiniz