const statsService = require('../services/statsService');

// 🎯 تحكم الإحصاءات
class StatsController {
  
  // تحديث الإحصاءات
  async updateStats(req, res) {
    try {
      const { action } = req.body;
      
      if (action === 'generate') {
        await statsService.incrementGenerated();
      } else if (action === 'check') {
        await statsService.incrementChecked();
      }
      
      const stats = await statsService.getStats();
      
      res.json({
        success: true,
        stats: stats,
        message: `Stats updated for ${action}`
      });
      
    } catch (error) {
      console.error('Stats update error:', error);
      res.status(500).json({
        error: 'Failed to update statistics',
        code: 500
      });
    }
  }
  
  // الحصول على الإحصاءات
  async getStats(req, res) {
    try {
      const stats = await statsService.getStats();
      
      res.json({
        success: true,
        stats: stats,
        message: 'Statistics retrieved successfully'
      });
      
    } catch (error) {
      console.error('Stats retrieval error:', error);
      res.status(500).json({
        error: 'Failed to retrieve statistics',
        code: 500
      });
    }
  }
}

module.exports = new StatsController();