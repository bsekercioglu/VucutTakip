# 🤖 Otomatik Commit Sistemi

Bu sistem, Cursor'da yaptığınız her değişikliği otomatik olarak GitHub'a commit edip push yapar.

## 📋 Özellikler

- ✅ **Otomatik Commit**: Dosya değişikliklerini otomatik algılar
- ✅ **Akıllı Bekleme**: Değişikliklerden sonra 5 saniye bekler
- ✅ **Dosya İzleme**: Gerçek zamanlı dosya değişikliği izleme
- ✅ **Hata Yönetimi**: Git hatalarını yakalar ve raporlar
- ✅ **Çoklu Platform**: Windows, macOS ve Linux desteği

## 🚀 Kullanım

### Seçenek 1: Basit Otomatik Commit (30 saniye aralıklarla)

```bash
# Node.js ile
npm run auto-commit

# Veya direkt
node auto-commit.js
```

### Seçenek 2: Gelişmiş Dosya İzleme (Anında tepki)

```bash
# Node.js ile
npm run auto-commit-watch

# Veya direkt
node auto-commit-watcher.js
```

### Seçenek 3: PowerShell (Windows)

```powershell
# PowerShell ile çalıştır
.\auto-commit.ps1
```

## ⚙️ Yapılandırma

### İzlenmeyecek Dosyalar

Aşağıdaki dosyalar otomatik commit'e dahil edilmez:

- `node_modules/**`
- `.git/**`
- `dist/**`
- `build/**`
- `*.log`
- `.env`
- `.env.local`
- `auto-commit.js`
- `auto-commit-watcher.js`

### Commit Mesaj Formatı

```
Auto-commit: [Tarih Saat] - Cursor değişiklikleri
```

Örnek: `Auto-commit: 15.12.2024 14:30:25 - Cursor değişiklikleri`

## 🔧 Kurulum

1. **Gerekli paketleri yükleyin:**
   ```bash
   npm install chokidar --save-dev
   ```

2. **Git repository'nizi hazırlayın:**
   ```bash
   git init
   git remote add origin [GITHUB_REPO_URL]
   ```

3. **Sistemi başlatın:**
   ```bash
   npm run auto-commit-watch
   ```

## 📝 Kullanım Senaryoları

### Geliştirme Sırasında
```bash
# Terminal 1: Uygulamayı çalıştır
npm run dev

# Terminal 2: Otomatik commit'i başlat
npm run auto-commit-watch
```

### Manuel Commit
```bash
# Otomatik commit'i durdurun (Ctrl+C)
# Manuel commit yapın
git add .
git commit -m "Manuel commit mesajı"
git push
```

## 🛠️ Sorun Giderme

### Git Kimlik Doğrulama Hatası
```bash
# GitHub token'ınızı ayarlayın
git config --global user.name "Kullanıcı Adınız"
git config --global user.email "email@example.com"
```

### Dosya İzleme Hatası
```bash
# chokidar paketini yeniden yükleyin
npm uninstall chokidar
npm install chokidar --save-dev
```

### Permission Hatası (Windows)
```powershell
# PowerShell'i yönetici olarak çalıştırın
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 🔄 Sistem Durumu

- 🟢 **Çalışıyor**: Sistem aktif ve değişiklikleri izliyor
- 🟡 **Bekliyor**: Değişiklik algılandı, commit için bekliyor
- 🔴 **Hata**: Git işlemi başarısız oldu

## 📊 Log Örnekleri

```
🤖 Gelişmiş otomatik commit sistemi başlatılıyor...
✅ Sistem hazır!
👀 Dosya değişiklikleri izleniyor...
📝 Dosya değişti: src/components/Button.tsx
🔄 Otomatik commit kontrolü başlatılıyor...
✅ Dosyalar stage'e eklendi
✅ Commit başarılı: Auto-commit: 15.12.2024 14:30:25 - Cursor değişiklikleri
✅ Push başarılı!
🚀 Değişiklikler GitHub'a gönderildi
```

## 🎯 İpuçları

1. **İlk kullanımda**: Sistem başlatılmadan önce mevcut değişiklikleri manuel commit edin
2. **Büyük değişiklikler**: Önemli değişiklikler için manuel commit kullanın
3. **Test**: Küçük bir değişiklik yaparak sistemin çalıştığını test edin
4. **Backup**: Önemli değişikliklerden önce branch oluşturun

## 🚨 Dikkat

- Sistem tüm değişiklikleri otomatik commit eder
- Hassas bilgileri (API anahtarları, şifreler) `.env` dosyasında tutun
- Büyük dosyaları `.gitignore`'a ekleyin
- Düzenli olarak manuel commit yaparak commit geçmişini temizleyin

---

**🎉 Artık Cursor'da yaptığınız her değişiklik otomatik olarak GitHub'a gönderilecek!**
