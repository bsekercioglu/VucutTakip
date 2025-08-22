import { addChange, generateCommitMessage } from './change-logger.js';

console.log('🧪 Commit Mesajı Test Sistemi\n');

// Test değişiklikleri ekle
addChange('Test değişiklik: README.md dosyası güncellendi', 'README.md');

// Commit mesajını oluştur ve göster
const message = generateCommitMessage();

console.log('📋 Oluşturulan Commit Mesajı:');
console.log('─'.repeat(60));
console.log(message);
console.log('─'.repeat(60));

// Mesajın satır sayısını göster
const lines = message.split('\n');
console.log(`📏 Toplam satır sayısı: ${lines.length}`);
