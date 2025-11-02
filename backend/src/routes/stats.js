const express = require('express');
const statsController = require('../controllers/statsController');
const { validateStatsRequest } = require('../middleware/validation');
const { bodySizeLimit } = require('../middleware/security');

const router = express.Router();

// 📊 مسارات الإحصاءات
router.get('/', statsController.getStats.bind(statsController));
router.post('/update', bodySizeLimit, validateStatsRequest, statsController.updateStats.bind(statsController));

module.exports = router;