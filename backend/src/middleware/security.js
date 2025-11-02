// 🔐 وسائط الأمان الإضافية

// منع هجمات MIME type sniffing
function noSniff(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
}

// منع هجمات XSS
function xssProtection(req, res, next) {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
}

// إخفاء معلومات السيرفر
function hidePoweredBy(req, res, next) {
  res.setHeader('X-Powered-By', 'Hasenha Security');
  next();
}

// التحقق من حجم البيانات
function bodySizeLimit(req, res, next) {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  
  if (contentLength > 10240) { // 10KB كحد أقصى
    return res.status(413).json({
      error: 'Request body too large',
      code: 413
    });
  }
  
  next();
}

module.exports = {
  noSniff,
  xssProtection,
  hidePoweredBy,
  bodySizeLimit
};