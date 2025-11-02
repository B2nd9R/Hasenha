const hibpService = require('../services/hibpService');

// 🔐 تحكم فحص كلمات المرور
class PasswordController {
  
  // فحص كلمة المرور مع HIBP
  async checkPassword(req, res) {
    try {
      const { password } = req.body;
      
      // نتحقق من وجود كلمة المرور (تم التحقق في الميدلوار)
      const result = await hibpService.checkPassword(password);
      
      res.json({
        success: true,
        breached: result.breached,
        breachCount: result.count,
        message: result.breached ? 
          `Password found in ${result.count} breaches` : 
          'Password not found in known breaches',
        hash: result.hash // للشفافية فقط - جزء من الهاش
      });
      
    } catch (error) {
      console.error('Password check error:', error);
      res.status(500).json({
        error: error.message || 'Failed to check password',
        code: 500
      });
    }
  }
}

module.exports = new PasswordController();