const crypto = require('crypto');

// 🤖 نظام كشف الشذوذ بالذكاء الاصطناعي
class AINomalyDetection {
  constructor() {
    this.requestPatterns = new Map();
    this.behaviorBaseline = new Map();
    this.learningMode = true;
    this.learningPeriod = 1000; // عدد الطلبات للتعلم
  }

  // تحليل سلوك الطلب
  analyzeBehavior(req, res) {
    const behavior = {
      id: crypto.randomBytes(8).toString('hex'),
      timestamp: Date.now(),
      ip: req.ip,
      method: req.method,
      path: req.path,
      responseTime: null,
      statusCode: res.statusCode,
      userAgent: req.get('User-Agent')?.substring(0, 50) || 'unknown',
      contentLength: parseInt(res.get('Content-Length') || '0')
    };

    // حساب وقت الاستجابة
    res.on('finish', () => {
      behavior.responseTime = Date.now() - behavior.timestamp;
      this.learnFromBehavior(behavior);
    });

    return behavior;
  }

  // التعلم من السلوك
  learnFromBehavior(behavior) {
    const ip = behavior.ip;
    
    if (!this.behaviorBaseline.has(ip)) {
      this.behaviorBaseline.set(ip, {
        requestCount: 0,
        avgResponseTime: 0,
        statusCodes: {},
        paths: new Set(),
        userAgents: new Set()
      });
    }

    const baseline = this.behaviorBaseline.get(ip);
    baseline.requestCount++;

    // تحديث متوسط وقت الاستجابة
    baseline.avgResponseTime = (
      baseline.avgResponseTime * (baseline.requestCount - 1) + behavior.responseTime
    ) / baseline.requestCount;

    // تحديث إحصائيات رموز الحالة
    baseline.statusCodes[behavior.statusCode] = 
      (baseline.statusCodes[behavior.statusCode] || 0) + 1;

    // تحديث المسارات
    baseline.paths.add(behavior.path);

    // تحديث User Agents
    if (behavior.userAgent !== 'unknown') {
      baseline.userAgents.add(behavior.userAgent);
    }

    // الانتقال لوضع الكشف بعد فترة التعلم
    if (this.learningMode && baseline.requestCount >= this.learningPeriod) {
      this.learningMode = false;
      console.log(`🎓 AI Learning completed for IP: ${ip}`);
    }
  }

  // كشف الشذوذ
  detectAnomalies(behavior) {
    if (this.learningMode) return { isAnomaly: false, confidence: 0 };

    const ip = behavior.ip;
    const baseline = this.behaviorBaseline.get(ip);

    if (!baseline) return { isAnomaly: false, confidence: 0 };

    let anomalyScore = 0;
    const reasons = [];

    // تحليل وقت الاستجابة
    const responseTimeDiff = Math.abs(behavior.responseTime - baseline.avgResponseTime);
    if (responseTimeDiff > baseline.avgResponseTime * 2) {
      anomalyScore += 30;
      reasons.push(`Abnormal response time: ${behavior.responseTime}ms`);
    }

    // تحليل رموز الحالة
    const successRate = (baseline.statusCodes[200] || 0) / baseline.requestCount;
    if (behavior.statusCode >= 400 && successRate > 0.8) {
      anomalyScore += 25;
      reasons.push(`Unexpected status code: ${behavior.statusCode}`);
    }

    // تحليل المسارات الجديدة
    if (!baseline.paths.has(behavior.path)) {
      anomalyScore += 20;
      reasons.push(`New path accessed: ${behavior.path}`);
    }

    // تحليل User Agent
    if (!baseline.userAgents.has(behavior.userAgent) && behavior.userAgent !== 'unknown') {
      anomalyScore += 15;
      reasons.push(`New User-Agent: ${behavior.userAgent}`);
    }

    // تحليل معدل الطلبات
    const recentRequests = this.getRecentRequests(ip, 60000); // آخر دقيقة
    if (recentRequests.length > 50) { // أكثر من 50 طلب في الدقيقة
      anomalyScore += 30;
      reasons.push(`High request rate: ${recentRequests.length}/min`);
    }

    const isAnomaly = anomalyScore > 50;
    const confidence = Math.min(anomalyScore, 100);

    if (isAnomaly) {
      console.warn(`🤖 AI ANOMALY DETECTED:`, {
        ip: behavior.ip,
        score: anomalyScore,
        confidence: confidence,
        reasons: reasons
      });
    }

    return { isAnomaly, confidence, reasons };
  }

  // الحصول على الطلبات الحديثة
  getRecentRequests(ip, timeWindow) {
    const now = Date.now();
    const recent = [];
    
    // في تطبيق حقيقي، سيتم تخزين هذا في قاعدة بيانات
    // هذا نموذج مبسط للتوضيح
    for (let [key, behavior] of this.requestPatterns) {
      if (behavior.ip === ip && (now - behavior.timestamp) < timeWindow) {
        recent.push(behavior);
      }
    }
    
    return recent;
  }

  // إحصائيات النظام
  getStats() {
    return {
      learningMode: this.learningMode,
      trackedIPs: this.behaviorBaseline.size,
      totalBehaviors: this.requestPatterns.size
    };
  }
}

module.exports = new AINomalyDetection();