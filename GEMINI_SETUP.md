# Google Gemini AI Kurulum Rehberi

## 🚀 API Key Alma

### 1. Google AI Studio'ya Giriş Yapın
1. [Google AI Studio](https://aistudio.google.com/app/apikey) adresine gidin
2. Google hesabınızla giriş yapın
3. **"Create API Key"** butonuna tıklayın
4. **"Create API key in new project"** seçeneğini seçin
5. API key'inizi kopyalayın

### 2. Environment Variables Ayarlama

#### Development (Local):
1. Proje klasöründe `.env` dosyası oluşturun
2. Aşağıdaki satırı ekleyin:
```
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

#### Production (Netlify):
1. Netlify Dashboard → Site Settings → Environment Variables
2. **"Add a variable"** tıklayın
3. **Key:** `VITE_GEMINI_API_KEY`
4. **Value:** API key'inizi yapıştırın
5. **Save** tıklayın

## 🎯 Özellikler

### ✅ **Gemini 1.5 Flash Model:**
- **Hızlı yanıt** - 1-2 saniye
- **Ücretsiz limit** - Günde 1,500 request
- **Akıllı** - Gerçek AI yanıtları
- **Türkçe** - Mükemmel Türkçe desteği

### 🧠 **Kişiselleştirme:**
- **Profil analizi** - Yaş, boy, kilo, cinsiyet
- **BMI hesaplama** - Otomatik sağlık değerlendirmesi
- **Hedef odaklı** - Kilo verme/alma/kas yapma
- **Güvenlik uyarıları** - Doktor onayı gerektiğinde

### 🔄 **Fallback Sistemi:**
- API key yoksa → Pattern-based yanıtlar
- API hatası olursa → Otomatik fallback
- Limit aşılırsa → Önceden hazırlanmış yanıtlar

## 📊 Kullanım Limitleri

### **Ücretsiz Plan:**
- **15 requests/minute**
- **1,500 requests/day** 
- **1 million tokens/day**

### **Tahmini Kullanım:**
- Ortalama soru: ~100 token
- Ortalama yanıt: ~300 token
- **Günlük ~2,500 soru** yanıtlanabilir

## 🧪 Test Etme

### 1. API Key Kontrolü:
```javascript
console.log('Gemini API Key:', import.meta.env.VITE_GEMINI_API_KEY ? 'Mevcut' : 'Eksik');
```

### 2. Test Soruları:
- "Kilo vermek için ne yapmalıyım?"
- "Kas yapmak istiyorum, beslenme önerisi"
- "Egzersiz programı önerisi"

### 3. Hata Durumları:
- API key yok → Pattern-based yanıt
- Rate limit → Fallback yanıt
- Network hatası → Hata mesajı

## ⚠️ Önemli Notlar

### **Güvenlik:**
- API key'i asla frontend kodunda hardcode etmeyin
- Environment variables kullanın
- `.env` dosyasını `.gitignore`'a ekleyin

### **Maliyet:**
- Ücretsiz limitler çoğu uygulama için yeterli
- Limit aşımında otomatik fallback
- Ücretli plana geçiş isteğe bağlı

### **Performans:**
- Gemini Flash çok hızlı (~1-2 saniye)
- Fallback sistem kesintisiz deneyim sağlar
- Caching ile performans artırılabilir

## 🔧 Sorun Giderme

### **"API key not found" Hatası:**
1. `.env` dosyasında `VITE_GEMINI_API_KEY` var mı kontrol edin
2. Netlify'da environment variable eklenmiş mi kontrol edin
3. Deployment sonrası environment variables güncellenmiş mi kontrol edin

### **"Quota exceeded" Hatası:**
- Günlük limit aşıldı, fallback sistem devreye girer
- Yarın tekrar deneyin veya ücretli plana geçin

### **Yavaş Yanıtlar:**
- Network bağlantısını kontrol edin
- API key doğru mu kontrol edin
- Gemini servis durumunu kontrol edin

## 📞 Destek

Sorun yaşarsanız:
1. Browser console'da hata mesajlarını kontrol edin
2. Network tab'da API isteklerini inceleyin
3. [Google AI Studio](https://aistudio.google.com/) servis durumunu kontrol edin