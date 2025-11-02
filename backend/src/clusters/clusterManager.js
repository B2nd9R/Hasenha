const cluster = require('cluster');
const os = require('os');

// 🚀 نظام متعدد النوى للأداء القصوى
class ClusterManager {
  constructor() {
    this.numCPUs = os.cpus().length;
    this.workers = new Map();
    this.restartAttempts = new Map();
  }

  // بدء نظام الكلستر
  start() {
    if (cluster.isPrimary) {
      console.log(`🎯 Master process started (PID: ${process.pid})`);
      console.log(`🚀 Forking ${this.numCPUs} workers...`);

      // إنشاء workers
      for (let i = 0; i < this.numCPUs; i++) {
        this.forkWorker();
      }

      // مراقبة workers
      cluster.on('exit', (worker, code, signal) => {
        console.warn(`⚠️ Worker ${worker.process.pid} died`);
        
        const attempts = this.restartAttempts.get(worker.id) || 0;
        
        if (attempts < 3) {
          console.log(`🔄 Restarting worker (attempt ${attempts + 1})...`);
          this.restartAttempts.set(worker.id, attempts + 1);
          this.forkWorker();
        } else {
          console.error(`❌ Worker ${worker.id} failed too many times, not restarting`);
        }
      });

      // مراقبة الذاكرة
      setInterval(() => {
        this.monitorResources();
      }, 30000);

    } else {
      // Worker process - تشغيل التطبيق
      require('../app');
    }
  }

  // إنشاء worker جديد
  forkWorker() {
    const worker = cluster.fork();
    
    this.workers.set(worker.id, {
      pid: worker.process.pid,
      startTime: Date.now(),
      restartCount: 0
    });

    worker.on('message', (message) => {
      this.handleWorkerMessage(worker, message);
    });

    console.log(`👷 Worker ${worker.process.pid} started`);
    return worker;
  }

  // معالجة رسائل Workers
  handleWorkerMessage(worker, message) {
    switch (message.type) {
      case 'stats':
        this.workers.get(worker.id).lastStats = message.data;
        break;
      case 'error':
        console.error(`Worker ${worker.process.pid} error:`, message.data);
        break;
    }
  }

  // مراقبة الموارد
  monitorResources() {
    const memoryUsage = process.memoryUsage();
    const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    console.log(`📊 Cluster Stats:`);
    console.log(`   Workers: ${Object.keys(cluster.workers).length}`);
    console.log(`   Memory: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Memory Usage: ${memoryPercent.toFixed(2)}%`);

    // إعادة تشغيل workers إذا استهلكت ذاكرة عالية
    if (memoryPercent > 85) {
      console.warn('🚨 High memory usage - considering worker restart');
    }
  }

  // إعادة تشغيل الكلستر
  gracefulShutdown() {
    console.log('🛑 Starting graceful shutdown...');
    
    for (const workerId in cluster.workers) {
      const worker = cluster.workers[workerId];
      worker.send({ type: 'shutdown' });
      
      setTimeout(() => {
        if (!worker.isDead()) {
          worker.kill();
        }
      }, 5000);
    }
    
    setTimeout(() => {
      console.log('👋 Cluster shutdown complete');
      process.exit(0);
    }, 10000);
  }
}

// تشغيل المدير إذا كان الملف هو الرئيسي
if (require.main === module) {
  const manager = new ClusterManager();
  manager.start();
  
  // معالجة إشارات الإغلاق
  process.on('SIGINT', () => manager.gracefulShutdown());
  process.on('SIGTERM', () => manager.gracefulShutdown());
}

module.exports = ClusterManager;