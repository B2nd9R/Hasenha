// ✅ وسائط التحقق من المدخلات

// التحقق من كلمة المرور للفحص
function validatePasswordCheck(req, res, next) {
  const { password } = req.body;
  
  if (!password || typeof password !== 'string') {
    return res.status(400).json({
      error: 'Password is required and must be a string',
      code: 400
    });
  }
  
  if (password.length > 256) {
    return res.status(400).json({
      error: 'Password too long',
      code: 400
    });
  }
  
  next();
}

// التحقق من طلبات الإحصاءات
function validateStatsRequest(req, res, next) {
  const { action } = req.body;
  
  if (!action || (action !== 'generate' && action !== 'check')) {
    return res.status(400).json({
      error: 'Valid action required: generate or check',
      code: 400
    });
  }
  
  next();
}

module.exports = {
  validatePasswordCheck,
  validateStatsRequest
};