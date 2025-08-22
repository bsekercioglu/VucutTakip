import { addChange, getRecentChanges, generateCommitMessage } from './change-logger.js';

console.log('🧪 Log Sistemi Testi\n');

// Test değişiklikleri ekle
addChange('Test değişiklik 1: README.md güncellendi', 'README.md');
addChange('Test değişiklik 2: Yeni özellik eklendi', 'src/components/NewFeature.tsx');
addChange('Test değişiklik 3: Bug düzeltildi', 'src/pages/Dashboard.tsx');

// Son değişiklikleri göster
console.log('📝 Son Değişiklikler:');
const changes = getRecentChanges(5);
changes.forEach((change, index) => {
  console.log(`${index + 1}. ${change.description} (${change.filePath})`);
});

console.log('\n📋 Commit Mesajı:');
console.log('─'.repeat(50));
console.log(generateCommitMessage());
console.log('─'.repeat(50));
