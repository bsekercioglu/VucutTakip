import fs from 'fs';
import path from 'path';

const LOG_FILE = 'change-log.json';

// Log dosyasını oku
function readLogFile() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const data = fs.readFileSync(LOG_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('❌ Log dosyası okunamadı:', error);
  }
  
  return {
    changes: [],
    lastUpdate: null
  };
}

// Log dosyasını yaz
function writeLogFile(data) {
  try {
    fs.writeFileSync(LOG_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('❌ Log dosyası yazılamadı:', error);
  }
}

// Yeni değişiklik ekle
export function addChange(description, filePath = null) {
  const log = readLogFile();
  const timestamp = new Date().toISOString();
  
  // Dosya türüne göre daha açıklayıcı mesaj oluştur
  let enhancedDescription = description;
  if (filePath) {
    enhancedDescription = generateSmartDescription(filePath, description);
  }
  
  const change = {
    id: Date.now().toString(),
    timestamp: timestamp,
    description: enhancedDescription,
    filePath: filePath,
    date: new Date().toLocaleString('tr-TR')
  };
  
  log.changes.push(change);
  log.lastUpdate = timestamp;
  
  writeLogFile(log);
  console.log(`📝 Değişiklik loglandı: ${enhancedDescription}`);
  
  return change;
}

// Akıllı açıklama oluştur
function generateSmartDescription(filePath, originalDescription) {
  if (!filePath) return originalDescription;
  
  const fileName = filePath.split(/[\/\\]/).pop();
  const fileExt = fileName.split('.').pop()?.toLowerCase();
  
  // Dosya türüne göre açıklama
  if (originalDescription.includes('Yeni dosya eklendi')) {
    switch (fileExt) {
      case 'tsx':
      case 'jsx':
        return `Yeni React bileşeni eklendi: ${fileName}`;
      case 'ts':
      case 'js':
        return `Yeni JavaScript/TypeScript dosyası eklendi: ${fileName}`;
      case 'md':
        return `Yeni dokümantasyon eklendi: ${fileName}`;
      case 'css':
      case 'scss':
        return `Yeni stil dosyası eklendi: ${fileName}`;
      case 'json':
        return `Yeni konfigürasyon dosyası eklendi: ${fileName}`;
      default:
        return `Yeni dosya eklendi: ${fileName}`;
    }
  }
  
  if (originalDescription.includes('Dosya güncellendi')) {
    switch (fileExt) {
      case 'tsx':
      case 'jsx':
        return `React bileşeni güncellendi: ${fileName}`;
      case 'ts':
      case 'js':
        return `JavaScript/TypeScript dosyası güncellendi: ${fileName}`;
      case 'md':
        return `Dokümantasyon güncellendi: ${fileName}`;
      case 'css':
      case 'scss':
        return `Stil dosyası güncellendi: ${fileName}`;
      case 'json':
        return `Konfigürasyon dosyası güncellendi: ${fileName}`;
      case 'html':
        return `HTML dosyası güncellendi: ${fileName}`;
      default:
        return `Dosya güncellendi: ${fileName}`;
    }
  }
  
  if (originalDescription.includes('Dosya silindi')) {
    return `Dosya silindi: ${fileName}`;
  }
  
  return originalDescription;
}

// Son değişiklikleri al
export function getRecentChanges(limit = 10) {
  const log = readLogFile();
  return log.changes.slice(-limit);
}

// Tüm değişiklikleri al
export function getAllChanges() {
  const log = readLogFile();
  return log.changes;
}

// Commit mesajı oluştur
export function generateCommitMessage() {
  const allChanges = getRecentChanges(10); // Son 10 değişiklik
  
  // Git dosyalarını filtrele, sadece anlamlı değişiklikleri al
  const meaningfulChanges = allChanges.filter(change => {
    if (!change.filePath) return true;
    
    // Git dosyalarını hariç tut
    if (change.filePath.startsWith('.git\\') || change.filePath.startsWith('.git/')) {
      return false;
    }
    
    // Change-log.json dosyasını hariç tut (kendi kendini logluyor)
    if (change.filePath === 'change-log.json') {
      return false;
    }
    
    return true;
  });
  
  if (meaningfulChanges.length === 0) {
    return `Auto-commit: ${new Date().toLocaleString('tr-TR')} - Genel güncellemeler`;
  }
  
  const timestamp = new Date().toLocaleString('tr-TR');
  let message = `Auto-commit: ${timestamp}\n\n`;
  
  meaningfulChanges.slice(0, 5).forEach((change, index) => {
    message += `${index + 1}. ${change.description}`;
    if (change.filePath) {
      message += ` (${change.filePath})`;
    }
    message += '\n';
  });
  
  return message.trim();
}

// Log dosyasını temizle (commit sonrası)
export function clearLog() {
  writeLogFile({
    changes: [],
    lastUpdate: null
  });
  console.log('🧹 Log dosyası temizlendi');
}

// Değişiklik istatistikleri
export function getChangeStats() {
  const log = readLogFile();
  const today = new Date().toDateString();
  
  const todayChanges = log.changes.filter(change => 
    new Date(change.timestamp).toDateString() === today
  );
  
  return {
    total: log.changes.length,
    today: todayChanges.length,
    lastUpdate: log.lastUpdate
  };
}
