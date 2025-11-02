const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { expressValidator } = require('express-validator');

// الأنظمة المتقدمة
const smartRateLimiter = require('./security/rateLimiter');
const threatDetection = require('./security/threatDetection');
const anomalyDetection = require('./ai/anomalyDetection');
const cache = require('./core/cache');
const encryption = require('./core/encryption');

// المسارات
const statsRoutes = require('./routes/stats');
const passwordRoutes = require('./routes/password');

const app = express();

// ⚡ وسائط متقدمة
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: false,
  methods: ['GET', 'POST']
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 🛡️ نظام الأمان المتقدم
app.use((req, res, next) => {
  // كشف التهديدات
  const threatScore = threatDetection.analyzeRequest(req);
  
  if (threatScore.isThreat) {
    return res.status(403).json({
      error: 'Access denied - suspicious activity detected',
      code: 403
    });
  }
  
  // تحليل السلوك
  const behavior = anomalyDetection.analyzeBehavior(req, res);
  
  // كشف الشذوذ
  res.on('finish', () => {
    const anomalies = anomalyDetection.detectAnomalies(behavior);
    if (anomalies.isAnomaly) {
      threatDetection.recordFailedAttempt(req.ip);
    }
  });
  
  next();
});

// ⚡ معدل الطلبات الذكي
app.use(smartRateLimiter.dynamicLimiter());

// 📊 مسارات API
app.use('/api/stats', statsRoutes);
app.use('/api/password', passwordRoutes);

// 🏠 مسارات النظام
app.get('/api/system/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cache: cache.getStats(),
    threats: threatDetection.threatLevels.size,
    anomalies: anomalyDetection.getStats()
  };
  
  res.json(health);
});

app.get('/api/system/security', (req, res) => {
  res.json({
    threatDetection: {
      blockedIPs: Array.from(threatDetection.blockedIPs),
      failedAttempts: Object.fromEntries(threatDetection.failedAttempts)
    },
    rateLimiting: smartRateLimiter.getStats(),
    encryption: {
      algorithm: encryption.algorithm,
      keyLength: encryption.keyLength
    }
  });
});

// ❌ معالجة المسارات غير الموجودة
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    code: 404
  });
});

// 🚨 معالجة الأخطاء المتقدمة
app.use((error, req, res, next) => {
  console.error('🚨 Advanced Error Handler:', error);
  
  // تسجيل الخطأ في نظام كشف التهديدات
  threatDetection.recordFailedAttempt(req.ip);
  
  res.status(500).json({
    error: 'Internal server error',
    code: 500,
    // إرجاع رسالة خطأ آمنة بدون تفاصيل
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
});

module.exports = app;