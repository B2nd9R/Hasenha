const express = require('express');
const passwordController = require('../controllers/passwordController');
const { validatePasswordCheck } = require('../middleware/validation');
const { bodySizeLimit } = require('../middleware/security');

const router = express.Router();

// 🔐 مسارات فحص كلمات المرور
router.post('/check', bodySizeLimit, validatePasswordCheck, passwordController.checkPassword.bind(passwordController));

module.exports = router;