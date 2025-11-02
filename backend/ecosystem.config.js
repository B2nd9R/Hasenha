module.exports = {
  apps: [{
    name: 'hasenha-backend-pro',
    script: './server.js',
    instances: 'max', // استخدام جميع النوى
    exec_mode: 'cluster',
    watch: false,
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    // إعدادات متقدمة للأداء
    instance_var: 'INSTANCE_ID',
    listen_timeout: 5000,
    kill_timeout: 5000,
    max_memory_restart: '1G', // إعادة التشغيل إذا تجاوزت الذاكرة 1GB
    // إعدادات السجل
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // إعدادات المراقبة
    merge_logs: true,
    // إعدادات التكرار
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};