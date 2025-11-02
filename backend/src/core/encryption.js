const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// 🔐 نظام تشفير عسكري المستوى
class MilitaryGradeEncryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.saltRounds = 12;
    this.encryptionKey = process.env.ENCRYPTION_KEY || this.generateKey();
  }

  // توليد مفتاح تشفير عشوائي
  generateKey() {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  // تشفير بيانات حساسة
  encrypt(text) {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, Buffer.from(this.encryptionKey));
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        iv: iv.toString('hex'),
        data: encrypted,
        tag: authTag.toString('hex'),
        algorithm: this.algorithm
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  // فك التشفير
  decrypt(encryptedData) {
    try {
      const decipher = crypto.createDecipher(
        encryptedData.algorithm, 
        Buffer.from(this.encryptionKey)
      );
      
      decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  // تشفير كلمة المرور باستخدام bcrypt (للمقارنة فقط)
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(this.saltRounds);
    return await bcrypt.hash(password, salt);
  }

  // التحقق من كلمة المرور المشفرة
  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  // إنشاء توقيع رقمي
  createSignature(data) {
    const hmac = crypto.createHmac('sha512', this.encryptionKey);
    return hmac.update(JSON.stringify(data)).digest('hex');
  }

  // التحقق من التوقيع
  verifySignature(data, signature) {
    const expectedSignature = this.createSignature(data);
    return crypto.timingSafeEqual(
      Buffer.from(signature), 
      Buffer.from(expectedSignature)
    );
  }
}

module.exports = new MilitaryGradeEncryption();