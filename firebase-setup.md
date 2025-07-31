# Firebase Kurulum Rehberi

## 1. Firebase Console Ayarları

### Authentication Kurulumu
1. Firebase Console'da projenizi açın
2. Authentication > Sign-in method bölümüne gidin
3. Email/Password seçeneğini etkinleştirin
4. Google ve Facebook providers'ı da etkinleştirebilirsiniz (isteğe bağlı)

### Firestore Database Kurulumu
1. Firestore Database > Create database
2. Start in test mode seçin (daha sonra production rules ekleyeceğiz)
3. Location seçin (Europe-west3 önerilir)

### Security Rules
Firestore Database > Rules bölümünde aşağıdaki kuralları ekleyin:

**ÖNEMLİ: Detaylı kurulum için `FIREBASE_RULES_SETUP.md` dosyasını okuyun.**

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

## 2. Veritabanı Yapısı

Firebase otomatik olarak aşağıdaki koleksiyonları oluşturacak:

### users/{userId}
```json
{
  "firstName": "string",
  "lastName": "string", 
  "email": "string",
  "gender": "male|female",
  "birthDate": "YYYY-MM-DD",
  "height": "number",
  "initialWeight": "number",
  "measurements": {
    "chest": "number",
    "waist": "number", 
    "hips": "number",
    "arm": "number",
    "thigh": "number"
  },
  "registrationDate": "YYYY-MM-DD",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### dailyRecords/{recordId}
```json
{
  "userId": "string",
  "date": "YYYY-MM-DD",
  "weight": "number",
  "bodyFat": "number (optional)",
  "waterPercentage": "number (optional)",
  "musclePercentage": "number (optional)",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### questions/{questionId}
```json
{
  "userId": "string",
  "title": "string",
  "message": "string", 
  "timestamp": "ISO string",
  "status": "pending|answered",
  "answer": "string (optional)",
  "answerTimestamp": "string (optional)",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## 3. İndeksler (Indexes)

Firebase Console > Firestore Database > Indexes bölümünde aşağıdaki composite indexes'leri oluşturun:

1. **dailyRecords koleksiyonu için:**
   - Collection: `dailyRecords`
   - Fields: `userId` (Ascending), `date` (Ascending)

2. **dailyTracking koleksiyonu için:**
   - Collection: `dailyTracking`
   - Fields: `userId` (Ascending), `date` (Descending)

3. **questions koleksiyonu için:**
   - Collection: `questions` 
   - Fields: `userId` (Ascending), `timestamp` (Descending)

**ÖNEMLİ: Index'ler oluşturulduktan sonra "Building" durumundan "Enabled" durumuna geçmesini bekleyin. Bu işlem birkaç dakika sürebilir.**
## 4. Environment Variables

`.env` dosyasında Firebase yapılandırma bilgilerinizi ekleyin:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## 5. Test Etme

1. Uygulamayı çalıştırın: `npm run dev`
2. Yeni bir kullanıcı kaydı oluşturun
3. Firebase Console'da `users` koleksiyonunda kullanıcı verisini kontrol edin
4. Günlük ölçüm ekleyin ve `dailyRecords` koleksiyonunu kontrol edin
5. Danışman sayfasından soru gönderin ve `questions` koleksiyonunu kontrol edin

## 6. Production Deployment

Netlify'da environment variables'ları ekleyin:
- Site settings > Environment variables
- Tüm `VITE_FIREBASE_*` değişkenlerini ekleyin