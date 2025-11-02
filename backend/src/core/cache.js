const NodeCache = require('node-cache');

// ⚡ نظام كاش ذكي مع أمان متقدم
class SmartCache {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300, // 5 دقائق افتراضياً
      checkperiod: 60,
      useClones: false,
      deleteOnExpire: true
    });
    
    this.encryptedKeys = new Set();
  }

  // تخزين بيانات مع تشفير اختياري
  set(key, data, ttl = 300, encrypt = false) {
    try {
      let value = data;
      
      if (encrypt && typeof data === 'object') {
        value = encryption.encrypt(JSON.stringify(data));
        this.encryptedKeys.add(key);
      }
      
      const success = this.cache.set(key, value, ttl);
      
      if (success) {
        this.log(`Cache SET: ${key} | TTL: ${ttl}s | Encrypted: ${encrypt}`);
      }
      
      return success;
    } catch (error) {
      console.error('Cache SET error:', error);
      return false;
    }
  }

  // استرجاع بيانات
  get(key) {
    try {
      const value = this.cache.get(key);
      
      if (value && this.encryptedKeys.has(key)) {
        const decrypted = encryption.decrypt(value);
        return JSON.parse(decrypted);
      }
      
      return value;
    } catch (error) {
      console.error('Cache GET error:', error);
      return null;
    }
  }

  // مسح انتقائي
  del(key) {
    this.encryptedKeys.delete(key);
    return this.cache.del(key);
  }

  // إحصائيات الكاش
  getStats() {
    const stats = this.cache.getStats();
    return {
      ...stats,
      encryptedKeys: this.encryptedKeys.size,
      totalMemory: process.memoryUsage().heapUsed
    };
  }

  // تنظيف الكاش
  flush() {
    this.encryptedKeys.clear();
    this.cache.flushAll();
    this.log('Cache flushed completely');
  }

  // سجل النشاط
  log(message) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CACHE] ${new Date().toISOString()} - ${message}`);
    }
  }
}

module.exports = new SmartCache();