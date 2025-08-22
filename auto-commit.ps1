# PowerShell Auto-Commit Script
# Cursor değişikliklerini otomatik olarak GitHub'a push eder

Write-Host "🤖 PowerShell Otomatik Commit Sistemi Başlatılıyor..." -ForegroundColor Green

function Auto-Commit {
    Write-Host "🔄 Git durumu kontrol ediliyor..." -ForegroundColor Yellow
    
    # Git durumunu kontrol et
    $status = git status --porcelain
    
    if ([string]::IsNullOrWhiteSpace($status)) {
        Write-Host "✅ Değişiklik yok, commit gerekmiyor" -ForegroundColor Green
        return
    }
    
    Write-Host "📝 Değişiklikler bulundu:" -ForegroundColor Cyan
    Write-Host $status
    
    # Tüm değişiklikleri stage'e ekle
    Write-Host "📦 Dosyalar stage'e ekleniyor..." -ForegroundColor Yellow
    git add .
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Dosyalar stage'e eklenemedi!" -ForegroundColor Red
        return
    }
    
    # Commit mesajı oluştur
    $timestamp = Get-Date -Format "dd.MM.yyyy HH:mm:ss"
    $commitMessage = "Auto-commit: $timestamp - Cursor değişiklikleri"
    
    # Commit yap
    Write-Host "💾 Commit yapılıyor..." -ForegroundColor Yellow
    git commit -m $commitMessage
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Commit yapılamadı!" -ForegroundColor Red
        return
    }
    
    Write-Host "✅ Commit başarılı: $commitMessage" -ForegroundColor Green
    
    # Push yap
    Write-Host "🚀 GitHub'a push yapılıyor..." -ForegroundColor Yellow
    git push
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Push yapılamadı!" -ForegroundColor Red
        return
    }
    
    Write-Host "✅ Push başarılı! Değişiklikler GitHub'a gönderildi" -ForegroundColor Green
}

# İlk çalıştırma
Auto-Commit

# Her 30 saniyede bir kontrol et
while ($true) {
    Start-Sleep -Seconds 30
    Auto-Commit
}
