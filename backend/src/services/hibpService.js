const fetch = require('node-fetch');
const crypto = require('crypto');

// 🔒 خدمة Have I Been Pwned API
class HIBPService {
  constructor() {
    this.baseURL = 'https://api.pwnedpasswords.com';
    this.timeout = 5000; // 5 ثواني
  }

  // إنشاء SHA-1 hash
  sha1(password) {
    return crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
  }

  // فحص كلمة المرور باستخدام k-Anonymity
  async checkPassword(password) {
    try {
      const passwordHash = this.sha1(password);
      const prefix = passwordHash.substring(0, 5);
      const suffix = passwordHash.substring(5);
      
      const response = await fetch(`${this.baseURL}/range/${prefix}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Hasenha-Password-Checker'
        },
        timeout: this.timeout
      });
      
      if (!response.ok) {
        throw new Error(`HIBP API error: ${response.status}`);
      }
      
      const data = await response.text();
      const found = data.includes(suffix);
      
      let count = 0;
      if (found) {
        const lines = data.split('\n');
        for (const line of lines) {
          if (line.startsWith(suffix)) {
            count = parseInt(line.split(':')[1]) || 1;
            break;
          }
        }
      }
      
      return {
        breached: found,
        count: count,
        hash: prefix + '***' // نعود فقط بجزء من الهاش للأمان
      };
      
    } catch (error) {
      console.error('HIBP Service Error:', error);
      throw new Error('Unable to check password at this time');
    }
  }
}

module.exports = new HIBPService();