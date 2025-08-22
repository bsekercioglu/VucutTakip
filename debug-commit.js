import { addChange, generateCommitMessage, getRecentChanges } from './change-logger.js';

console.log('🐛 Debug: Commit Mesajı Sistemi\n');

// Birkaç test değişikliği ekle
addChange('Test 1: Dokümantasyon güncellendi', 'README.md');
addChange('Test 2: Bileşen eklendi', 'src/components/NewComponent.tsx');
addChange('Test 3: Stil dosyası güncellendi', 'src/styles/main.css');

console.log('📝 Loglanmış değişiklikler:');
const changes = getRecentChanges(10);
changes.forEach((change, index) => {
  console.log(`${index + 1}. ${change.description} (${change.filePath})`);
});

console.log('\n📋 Commit mesajı:');
const message = generateCommitMessage();
console.log('─'.repeat(60));
console.log(message);
console.log('─'.repeat(60));

console.log('\n📊 Mesaj istatistikleri:');
console.log(`Toplam karakter: ${message.length}`);
console.log(`Toplam satır: ${message.split('\n').length}`);
console.log(`Boş satırlar: ${message.split('\n').filter(line => line.trim() === '').length}`);
