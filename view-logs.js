import { getAllChanges, getChangeStats } from './change-logger.js';

console.log('📊 Değişiklik Logları\n');

// İstatistikleri göster
const stats = getChangeStats();
console.log(`📈 İstatistikler:`);
console.log(`   Toplam değişiklik: ${stats.total}`);
console.log(`   Bugünkü değişiklik: ${stats.today}`);
console.log(`   Son güncelleme: ${stats.lastUpdate ? new Date(stats.lastUpdate).toLocaleString('tr-TR') : 'Yok'}\n`);

// Tüm değişiklikleri göster
const changes = getAllChanges();

if (changes.length === 0) {
  console.log('📝 Henüz değişiklik logu yok.');
} else {
  console.log('📝 Tüm Değişiklikler:');
  console.log('─'.repeat(80));
  
  changes.forEach((change, index) => {
    console.log(`${index + 1}. ${change.description}`);
    if (change.filePath) {
      console.log(`   📁 Dosya: ${change.filePath}`);
    }
    console.log(`   🕒 Tarih: ${change.date}`);
    console.log('');
  });
}

console.log('─'.repeat(80));
console.log('💡 Bu loglar otomatik commit sistemi tarafından oluşturulur.');
console.log('💡 Commit sonrası loglar temizlenir.');
