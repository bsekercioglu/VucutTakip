import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { generateCommitMessage, clearLog, getChangeStats } from './change-logger.js';

// Git durumunu kontrol et ve değişiklikleri commit et
function autoCommit() {
  console.log('🔄 Otomatik commit kontrolü başlatılıyor...');
  
  // Git durumunu kontrol et
  exec('git status --porcelain', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Git durumu kontrol edilemedi:', error);
      return;
    }
    
    if (stdout.trim() === '') {
      console.log('✅ Değişiklik yok, commit gerekmiyor');
      return;
    }
    
    console.log('📝 Değişiklikler bulundu:');
    console.log(stdout);
    
    // Tüm değişiklikleri stage'e ekle
    exec('git add .', (addError, addStdout, addStderr) => {
      if (addError) {
        console.error('❌ Dosyalar stage\'e eklenemedi:', addError);
        return;
      }
      
             console.log('✅ Dosyalar stage\'e eklendi');
       
       // Log istatistiklerini göster
       const stats = getChangeStats();
       console.log(`📊 Bugün ${stats.today} değişiklik, toplam ${stats.total} değişiklik`);
       
       // Commit mesajı oluştur
       const commitMessage = generateCommitMessage();
      
      // Commit mesajını dosyaya yaz
      const commitMsgFile = '.commit-msg.tmp';
      fs.writeFileSync(commitMsgFile, commitMessage, 'utf8');
      
      // Commit yap
      exec(`git commit -F "${commitMsgFile}"`, (commitError, commitStdout, commitStderr) => {
        // Geçici dosyayı sil
        try {
          fs.unlinkSync(commitMsgFile);
        } catch (e) {
          // Dosya zaten silinmiş olabilir
        }
        
        if (commitError) {
          console.error('❌ Commit yapılamadı:', commitError);
          return;
        }
        
        console.log('✅ Commit başarılı:', commitMessage.split('\n')[0]);
        
        // Push yap
        exec('git push', (pushError, pushStdout, pushStderr) => {
          if (pushError) {
            console.error('❌ Push yapılamadı:', pushError);
            return;
          }
          
                     console.log('✅ Push başarılı!');
           console.log('🚀 Değişiklikler GitHub\'a gönderildi');
           
           // Log dosyasını temizle (push sonrası)
           clearLog();
        });
      });
    });
  });
}

// İlk çalıştırma
autoCommit();

// Her 30 saniyede bir kontrol et
setInterval(autoCommit, 30000);

console.log('🤖 Otomatik commit sistemi başlatıldı!');
console.log('⏰ Her 30 saniyede bir kontrol edilecek');
console.log('🛑 Durdurmak için Ctrl+C tuşlayın');
