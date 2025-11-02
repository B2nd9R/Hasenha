const databaseManager = require('./databaseManager');

// 📊 خدمة الإحصاءات المجهولة (تدعم كلا النوعين)
class StatsService {
  
  // زيادة عداد التوليد
  async incrementGenerated() {
    const dbType = databaseManager.getType();
    
    if (dbType === 'supabase') {
      const supabase = databaseManager.getDB();
      const { data, error } = await supabase
        .rpc('increment_generated');
      
      if (error) throw error;
      return data;
    } else {
      // SQLite implementation
      return new Promise((resolve, reject) => {
        const db = databaseManager.getDB();
        db.run(
          'UPDATE stats SET total_generated = total_generated + 1, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
          function(err) {
            if (err) reject(err);
            else resolve(this.changes);
          }
        );
      });
    }
  }
  
  // زيادة عداد الفحص
  async incrementChecked() {
    const dbType = databaseManager.getType();
    
    if (dbType === 'supabase') {
      const supabase = databaseManager.getDB();
      const { data, error } = await supabase
        .rpc('increment_checked');
      
      if (error) throw error;
      return data;
    } else {
      // SQLite implementation
      return new Promise((resolve, reject) => {
        const db = databaseManager.getDB();
        db.run(
          'UPDATE stats SET total_checked = total_checked + 1, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
          function(err) {
            if (err) reject(err);
            else resolve(this.changes);
          }
        );
      });
    }
  }
  
  // الحصول على الإحصاءات الحالية
  async getStats() {
    const dbType = databaseManager.getType();
    
    if (dbType === 'supabase') {
      const supabase = databaseManager.getDB();
      const { data, error } = await supabase
        .from('stats')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // SQLite implementation
      return new Promise((resolve, reject) => {
        const db = databaseManager.getDB();
        db.get(
          'SELECT total_generated, total_checked, updated_at FROM stats WHERE id = 1',
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });
    }
  }
}

module.exports = new StatsService();