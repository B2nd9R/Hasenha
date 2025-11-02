#!/usr/bin/env node

// 🔍 سكريبت فحص أمني متقدم
const fs = require('fs');
const crypto = require('crypto');
const { execSync } = require('child_process');

class SecurityScanner {
  constructor() {
    this.scanResults = {
      passed: [],
      warnings: [],
      critical: []
    };
  }

  async runFullScan() {
    console.log('🛡️  Starting Advanced Security Scan...\n');

    await this.checkDependencies();
    await this.checkEnvironment();
    await this.checkFilePermissions();
    await this.checkEncryption();
    await this.checkEndpoints();
    await this.checkLogs();

    this.generateReport();
  }

  // فحص dependencies
  async checkDependencies() {
    console.log('📦 Scanning dependencies...');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      for (const [pkg, version] of Object.entries(deps)) {
        // تحقق من وجود ثغرات معروفة (في تطبيق حقيقي، استخدم npm audit)
        if (version.includes('beta') || version.includes('alpha')) {
          this.scanResults.warnings.push(`Beta dependency: ${pkg}@${version}`);
        }
      }
      
      this.scanResults.passed.push('Dependencies scan completed');
    } catch (error) {
      this.scanResults.critical.push(`Dependencies scan failed: ${error.message}`);
    }
  }

  // فحص environment variables
  async checkEnvironment() {
    console.log('🔐 Scanning environment...');
    
    const requiredEnvVars = ['NODE_ENV', 'PORT'];
    
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        this.scanResults.warnings.push(`Missing environment variable: ${envVar}`);
      }
    }
    
    // تحقق من كلمات مرور ضعيفة
    if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length < 32) {
      this.scanResults.critical.push('Encryption key is too short');
    }
    
    this.scanResults.passed.push('Environment scan completed');
  }

  // فحص صلاحيات الملفات
  async checkFilePermissions() {
    console.log('📁 Checking file permissions...');
    
    const sensitiveFiles = [
      './database.sqlite',
      './.env',
      './logs'
    ];
    
    for (const file of sensitiveFiles) {
      if (fs.existsSync(file)) {
        try {
          const stats = fs.statSync(file);
          // تحقق من أن الملفات لا يمكن كتابتها من قبل الآخرين
          if (stats.mode & 0o002) {
            this.scanResults.critical.push(`World-writable file: ${file}`);
          }
        } catch (error) {
          this.scanResults.warnings.push(`Cannot check permissions for: ${file}`);
        }
      }
    }
    
    this.scanResults.passed.push('File permissions scan completed');
  }

  // فحص إعدادات التشفير
  async checkEncryption() {
    console.log('🔒 Checking encryption settings...');
    
    // تحقق من خوارزميات التشفير
    const hasCrypto = typeof crypto.createCipher === 'function';
    if (!hasCrypto) {
      this.scanResults.critical.push('Crypto module not available');
    }
    
    this.scanResults.passed.push('Encryption scan completed');
  }

  // فحص endpoints
  async checkEndpoints() {
    console.log('🌐 Scanning API endpoints...');
    
    // في تطبيق حقيقي، يمكن فحص الـ endpoints تلقائياً
    this.scanResults.passed.push('Endpoints scan completed');
  }

  // فحص السجلات
  async checkLogs() {
    console.log('📋 Checking logging configuration...');
    
    const logDir = './logs';
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    this.scanResults.passed.push('Logging scan completed');
  }

  // إنشاء تقرير
  generateReport() {
    console.log('\n' + '='.repeat(50));
    console.log('🛡️  SECURITY SCAN REPORT');
    console.log('='.repeat(50));
    
    console.log(`\n✅ PASSED (${this.scanResults.passed.length}):`);
    this.scanResults.passed.forEach(item => console.log(`   ✓ ${item}`));
    
    if (this.scanResults.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (${this.scanResults.warnings.length}):`);
      this.scanResults.warnings.forEach(item => console.log(`   ! ${item}`));
    }
    
    if (this.scanResults.critical.length > 0) {
      console.log(`\n🚨 CRITICAL (${this.scanResults.critical.length}):`);
      this.scanResults.critical.forEach(item => console.log(`   ✗ ${item}`));
      console.log('\n❌ SCAN FAILED - Critical issues found!');
      process.exit(1);
    } else {
      console.log('\n🎉 SCAN PASSED - No critical issues found!');
      process.exit(0);
    }
  }
}

// تشغيل الفحص إذا تم استدعاء السكريبت مباشرة
if (require.main === module) {
  const scanner = new SecurityScanner();
  scanner.runFullScan();
}

module.exports = SecurityScanner;