// Debug ve geliştirme ayarları
export const appConfig = {
  // Debug modu - sadece development'ta true olmalı
  debugLog: import.meta.env.DEV && import.meta.env.VITE_DEBUG_LOG === 'true',
  
  // Environment bilgisi
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // API ayarları
  apiTimeout: 30000, // 30 saniye
  
  // Toast ayarları
  toastDuration: 5000, // 5 saniye
  
  // Pagination ayarları
  defaultPageSize: 10,
  
  // Validation ayarları
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  
  // Firebase ayarları
  maxRetries: 3,
  retryDelay: 1000, // 1 saniye
};

// Debug logger utility
export const debugLog = {
  log: (...args: any[]) => {
    if (appConfig.debugLog) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  error: (...args: any[]) => {
    if (appConfig.debugLog) {
      console.error('[DEBUG ERROR]', ...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (appConfig.debugLog) {
      console.warn('[DEBUG WARN]', ...args);
    }
  },
  
  info: (...args: any[]) => {
    if (appConfig.debugLog) {
      console.info('[DEBUG INFO]', ...args);
    }
  }
};
