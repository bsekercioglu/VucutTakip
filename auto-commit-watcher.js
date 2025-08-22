import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import { addChange, generateCommitMessage, clearLog, getChangeStats } from './change-logger.js';

// Git durumunu kontrol et ve değişiklikleri commit et
function autoCommit() {
  return new Promise((resolve, reject) => {
    console.log('🔄 Otomatik commit kontrolü başlatılıyor...');
    
    // Git durumunu kontrol et
    exec('git status --porcelain', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Git durumu kontrol edilemedi:', error);
        reject(error);
        return;
      }
      
      if (stdout.trim() === '') {
        console.log('✅ Değişiklik yok, commit gerekmiyor');
        resolve();
        return;
      }
      
      console.log('📝 Değişiklikler bulundu:');
      console.log(stdout);
      
      // Tüm değişiklikleri stage'e ekle
      exec('git add .', (addError, addStdout, addStderr) => {
        if (addError) {
          console.error('❌ Dosyalar stage\'e eklenemedi:', addError);
          reject(addError);
          return;
        }
        
                 console.log('✅ Dosyalar stage\'e eklendi');
         
         // Log istatistiklerini göster
         const stats = getChangeStats();
         console.log(`📊 Bugün ${stats.today} değişiklik, toplam ${stats.total} değişiklik`);
         
         // Commit mesajı oluştur
         const commitMessage = generateCommitMessage();
        
        // Commit yap
        exec(`git commit -m "${commitMessage}"`, (commitError, commitStdout, commitStderr) => {
          if (commitError) {
            console.error('❌ Commit yapılamadı:', commitError);
            reject(commitError);
            return;
          }
          
          console.log('✅ Commit başarılı:', commitMessage);
          
          // Push yap
          exec('git push', (pushError, pushStdout, pushStderr) => {
            if (pushError) {
              console.error('❌ Push yapılamadı:', pushError);
              reject(pushError);
              return;
            }
            
                         console.log('✅ Push başarılı!');
             console.log('🚀 Değişiklikler GitHub\'a gönderildi');
             
             // Log dosyasını temizle
             clearLog();
             
             resolve();
          });
        });
      });
    });
  });
}

// Dosya değişikliklerini izle
function watchFiles() {
  console.log('👀 Dosya değişiklikleri izleniyor...');
  
     // İzlenmeyecek dosyalar
   const ignoredFiles = [
     'node_modules/**',
     '.git/**',
     'dist/**',
     'build/**',
     '*.log',
     '.env',
     '.env.local',
     'auto-commit.js',
     'auto-commit-watcher.js',
     'change-log.json'
   ];
  
  // Dosya değişikliklerini izle
  const watcher = chokidar.watch('.', {
    ignored: ignoredFiles,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    }
  });
  
  let commitTimeout = null;
  
     // Dosya değişikliği olduğunda
   watcher.on('change', (filePath) => {
     console.log(`📝 Dosya değişti: ${filePath}`);
     
     // Değişikliği logla (Git dosyalarını hariç tut)
     const relativePath = path.relative('.', filePath);
     if (!relativePath.startsWith('.git\\') && !relativePath.startsWith('.git/') && relativePath !== 'change-log.json') {
       addChange(`Dosya güncellendi: ${relativePath}`, relativePath);
     }
     
     // Önceki timeout'u temizle
     if (commitTimeout) {
       clearTimeout(commitTimeout);
     }
     
     // 5 saniye bekle ve commit yap
     commitTimeout = setTimeout(async () => {
       try {
         await autoCommit();
       } catch (error) {
         console.error('❌ Otomatik commit başarısız:', error);
       }
     }, 5000);
   });
  
     // Dosya eklendiğinde
   watcher.on('add', (filePath) => {
     console.log(`➕ Dosya eklendi: ${filePath}`);
     
     // Değişikliği logla (Git dosyalarını hariç tut)
     const relativePath = path.relative('.', filePath);
     if (!relativePath.startsWith('.git\\') && !relativePath.startsWith('.git/') && relativePath !== 'change-log.json') {
       addChange(`Yeni dosya eklendi: ${relativePath}`, relativePath);
     }
     
     if (commitTimeout) {
       clearTimeout(commitTimeout);
     }
     
     commitTimeout = setTimeout(async () => {
       try {
         await autoCommit();
       } catch (error) {
         console.error('❌ Otomatik commit başarısız:', error);
       }
     }, 5000);
   });
  
     // Dosya silindiğinde
   watcher.on('unlink', (filePath) => {
     console.log(`🗑️ Dosya silindi: ${filePath}`);
     
     // Değişikliği logla
     const relativePath = path.relative('.', filePath);
     addChange(`Dosya silindi: ${relativePath}`, relativePath);
     
     if (commitTimeout) {
       clearTimeout(commitTimeout);
     }
     
     commitTimeout = setTimeout(async () => {
       try {
         await autoCommit();
       } catch (error) {
         console.error('❌ Otomatik commit başarısız:', error);
       }
     }, 5000);
   });
  
  return watcher;
}

// Ana fonksiyon
async function main() {
  try {
    console.log('🤖 Gelişmiş otomatik commit sistemi başlatılıyor...');
    
    // İlk commit kontrolü
    await autoCommit();
    
    // Dosya izlemeyi başlat
    const watcher = watchFiles();
    
    console.log('✅ Sistem hazır!');
    console.log('👀 Dosya değişiklikleri izleniyor...');
    console.log('⏰ 5 saniye bekleme süresi');
    console.log('🛑 Durdurmak için Ctrl+C tuşlayın');
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Sistem kapatılıyor...');
      watcher.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Sistem başlatılamadı:', error);
    process.exit(1);
  }
}

// Scripti çalıştır
main();
