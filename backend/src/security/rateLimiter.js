const RateLimit = require('express-rate-limit');

// 🛡️ نظام معدل طلبات ذكي ومتعدد المستويات
class SmartRateLimiter {
  constructor() {
    this.limiters = new Map();
    this.initLimiters();
  }

  // تهيئة معدلات الطلبات
  initLimiters() {
    // 🔵 معدل عادي للمستخدمين العاديين
    this.limiters.set('normal', RateLimit({
      windowMs: 15 * 60 * 1000, // 15 دقيقة
      max: 100, // 100 طلب كل 15 دقيقة
      message: {
        error: 'Too many requests - normal limit exceeded',
        code: 429,
        retryAfter: 15 * 60
      },
      standardHeaders: true,
      legacyHeaders: false
    }));

    // 🟡 معدل صارم لفحص كلمات المرور
    this.limiters.set('password_check', RateLimit({
      windowMs: 60 * 1000, // 1 دقيقة
      max: 10, // 10 فحوصات فقط في الدقيقة
      message: {
        error: 'Password check limit exceeded - please wait',
        code: 429,
        retryAfter: 60
      },
      skipSuccessfulRequests: false
    }));

    // 🔴 معدل شديد للـ API
    this.limiters.set('api_strict', RateLimit({
      windowMs: 60 * 1000, // 1 دقيقة
      max: 30, // 30 طلب في الدقيقة
      message: {
        error: 'API rate limit exceeded',
        code: 429,
        retryAfter: 60
      }
    }));

    // ⚫ معدل للعنواين المشبوهة
    this.limiters.set('suspicious', RateLimit({
      windowMs: 5 * 60 * 1000, // 5 دقائق
      max: 5, // 5 طلبات فقط كل 5 دقائق
      message: {
        error: 'Suspicious activity detected - rate limited',
        code: 429,
        retryAfter: 5 * 60
      }
    }));
  }

  // الحصول على معدل مناسب بناءً على الطلب
  getLimiter(req) {
    const ip = req.ip;
    const path = req.path;
    const userAgent = req.get('User-Agent') || '';

    // تحقق من IPs مشبوهة
    if (threatDetection.blockedIPs.has(ip)) {
      return this.limiters.get('suspicious');
    }

    // حدود خاصة لفحص كلمات المرور
    if (path.includes('/password/check')) {
      return this.limiters.get('password_check');
    }

    // حدود للـ API
    if (path.startsWith('/api/')) {
      return this.limiters.get('api_strict');
    }

    // المعدل العادي
    return this.limiters.get('normal');
  }

  // middleware ديناميكي
  dynamicLimiter() {
    return (req, res, next) => {
      const limiter = this.getLimiter(req);
      limiter(req, res, next);
    };
  }

  // تحديث الحدود ديناميكياً
  updateLimits(limiterName, newMax) {
    const limiter = this.limiters.get(limiterName);
    if (limiter) {
      limiter.max = newMax;
      console.log(`Updated ${limiterName} limit to ${newMax}`);
    }
  }

  // إحصائيات الاستخدام
  getStats() {
    const stats = {};
    
    for (const [name, limiter] of this.limiters) {
      stats[name] = {
        max: limiter.max,
        windowMs: limiter.windowMs
      };
    }
    
    return stats;
  }
}

module.exports = new SmartRateLimiter();