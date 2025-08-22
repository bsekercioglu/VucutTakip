import { generateCommitMessage } from './change-logger.js';

console.log('🧪 Akıllı Commit Mesajı Testi\n');

// Commit mesajını oluştur
const message = generateCommitMessage();

console.log('📋 Oluşturulan Commit Mesajı:');
console.log('─'.repeat(60));
console.log(message);
console.log('─'.repeat(60));
