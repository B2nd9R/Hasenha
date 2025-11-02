const geoip = require('node-geoip');
const crypto = require('crypto');

// 🛡️ نظام كشف التهديدات المتقدم
class ThreatDetectionSystem {
  constructor() {
    this.suspiciousPatterns = [
      /(\b)(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)(\b)/gi,
      /(\b)(script|alert|onerror|onload)(\b)/gi,
      /(\.\.\/|\.\.\\|\\\.\.)/gi,
      /(<|>|&lt;|&gt;)/gi
    ];
    
    this.failedAttempts = new Map();
    this.blockedIPs = new Set();
    this.threatLevels = new Map();
  }

  // تحليل الطلب لاكتشاف التهديدات
  analyzeRequest(req) {
    const threatScore = {
      total: 0,
      categories: {},
      isThreat: false
    };

    // تحليل IP
    const ipThreat = this.analyzeIP(req.ip);
    threatScore.categories.ip = ipThreat.score;
    threatScore.total += ipThreat.score;

    // تحليل User-Agent
    const uaThreat = this.analyzeUserAgent(req.get('User-Agent'));
    threatScore.categories.userAgent = uaThreat.score;
    threatScore.total += uaThreat.score;

    // تحليل المسار
    const pathThreat = this.analyzePath(req.path);
    threatScore.categories.path = pathThreat.score;
    threatScore.total += pathThreat.score;

    // تحليل البارامترات
    const paramsThreat = this.analyzeParameters(req.query, req.body);
    threatScore.categories.parameters = paramsThreat.score;
    threatScore.total += paramsThreat.score;

    // تحليل التوقيت
    const timingThreat = this.analyzeTiming(req.ip);
    threatScore.categories.timing = timingThreat.score;
    threatScore.total += timingThreat.score;

    threatScore.isThreat = threatScore.total > 15; // عتبة التهديد

    // تسجيل التهديد
    if (threatScore.isThreat) {
      this.logThreat(req, threatScore);
    }

    return threatScore;
  }

  // تحليل IP
  analyzeIP(ip) {
    let score = 0;
    const details = [];

    // تحقق من IPs مسجلة
    if (this.blockedIPs.has(ip)) {
      score += 10;
      details.push('IP is blocked');
    }

    // تحقق من محاولات فاشلة
    const attempts = this.failedAttempts.get(ip) || 0;
    if (attempts > 5) {
      score += attempts;
      details.push(`High failed attempts: ${attempts}`);
    }

    // تحليل جغرافي (يمكن إضافة المزيد)
    try {
      const geo = geoip.lookup(ip);
      if (geo && ['CN', 'RU', 'BR'].includes(geo.country)) {
        score += 2;
        details.push(`Suspicious country: ${geo.country}`);
      }
    } catch (error) {
      // تجاهل الأخطاء في التحليل الجغرافي
    }

    return { score, details };
  }

  // تحليل User-Agent
  analyzeUserAgent(ua) {
    let score = 0;
    const details = [];

    if (!ua) {
      score += 5;
      details.push('Missing User-Agent');
      return { score, details };
    }

    // أنماط مشبوهة في User-Agent
    const suspiciousUAs = [
      /curl|wget|python|scrapy|bot|crawl/i,
      /nikto|sqlmap|nmap|metasploit/i
    ];

    for (const pattern of suspiciousUAs) {
      if (pattern.test(ua)) {
        score += 3;
        details.push('Suspicious User-Agent pattern');
        break;
      }
    }

    return { score, details };
  }

  // تحليل المسار
  analyzePath(path) {
    let score = 0;
    const details = [];

    // مسارات خطيرة
    const dangerousPaths = [
      /\.\./,
      /\/\.\//,
      /\/etc\/passwd/,
      /\/proc\/self/,
      /\.env/,
      /\.git/
    ];

    for (const pattern of dangerousPaths) {
      if (pattern.test(path)) {
        score += 10;
        details.push('Dangerous path pattern detected');
        break;
      }
    }

    return { score, details };
  }

  // تحليل البارامترات
  analyzeParameters(query, body) {
    let score = 0;
    const details = [];

    const allParams = { ...query, ...body };

    for (const [key, value] of Object.entries(allParams)) {
      if (typeof value === 'string') {
        for (const pattern of this.suspiciousPatterns) {
          if (pattern.test(value)) {
            score += 5;
            details.push(`Suspicious parameter: ${key}`);
            break;
          }
        }
      }
    }

    return { score, details };
  }

  // تحليل التوقيت
  analyzeTiming(ip) {
    let score = 0;
    const details = [];

    const now = Date.now();
    const lastRequest = this.threatLevels.get(`${ip}_last`) || now;
    const timeDiff = now - lastRequest;

    // طلبات سريعة جداً
    if (timeDiff < 100) { // أقل من 100ms
      score += 3;
      details.push('Rapid requests detected');
    }

    this.threatLevels.set(`${ip}_last`, now);

    return { score, details };
  }

  // تسجيل التهديد
  logThreat(req, threatScore) {
    const threatLog = {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
      threatScore: threatScore,
      headers: this.sanitizeHeaders(req.headers)
    };

    console.warn('🚨 HIGH THREAT DETECTED:', threatLog);

    // حظر IP مؤقت
    this.blockedIPs.add(req.ip);
    setTimeout(() => {
      this.blockedIPs.delete(req.ip);
    }, 15 * 60 * 1000); // 15 دقيقة
  }

  // تنظيف الهيدرات للتسجيل
  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    delete sanitized['authorization'];
    delete sanitized['cookie'];
    delete sanitized['x-api-key'];
    return sanitized;
  }

  // تسجيل محاولة فاشلة
  recordFailedAttempt(ip) {
    const attempts = this.failedAttempts.get(ip) || 0;
    this.failedAttempts.set(ip, attempts + 1);

    // إعادة تعيين بعد فترة
    setTimeout(() => {
      const current = this.failedAttempts.get(ip) || 0;
      if (current > 0) {
        this.failedAttempts.set(ip, current - 1);
      }
    }, 10 * 60 * 1000); // 10 دقائق
  }
}

module.exports = new ThreatDetectionSystem();