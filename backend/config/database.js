const { createClient } = require('@supabase/supabase-js');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseManager {
  constructor() {
    this.type = process.env.DATABASE_TYPE || 'supabase'; // 'supabase' أو 'sqlite'
    this.db = null;
    this.supabase = null;
  }

  async initDatabase() {
    if (this.type === 'supabase') {
      // 🔄 الاتصال بـ Supabase
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      
      console.log('✅ Connected to Supabase database');
      
      // التأكد من وجود الجدول
      await this.createStatsTable();
      
    } else {
      // SQLite للسيرفر المحلي
      const dbPath = path.join(__dirname, '..', 'database.sqlite');
      this.db = new sqlite3.Database(dbPath);
      
      console.log('✅ Connected to SQLite database');
      
      await this.createSQLiteTables();
    }
  }

  async createStatsTable() {
    // في Supabase، تحتاج لإنشاء الجدول يدوياً عبر Dashboard
    // هذا الكود للتحقق من وجود البيانات فقط
    const { data, error } = await this.supabase
      .from('stats')
      .select('*')
      .eq('id', 1);
    
    if (!data || data.length === 0) {
      const { error: insertError } = await this.supabase
        .from('stats')
        .insert([
          { 
            id: 1, 
            total_generated: 0, 
            total_checked: 0 
          }
        ]);
      
      if (insertError) {
        console.error('Error creating stats record:', insertError);
      } else {
        console.log('✅ Created default stats record in Supabase');
      }
    }
  }

  async createSQLiteTables() {
    return new Promise((resolve, reject) => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS stats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          total_generated INTEGER DEFAULT 0,
          total_checked INTEGER DEFAULT 0,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        this.db.get("SELECT COUNT(*) as count FROM stats", (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (row.count === 0) {
            this.db.run("INSERT INTO stats (total_generated, total_checked) VALUES (0, 0)", (err) => {
              if (err) reject(err);
              else resolve();
            });
          } else {
            resolve();
          }
        });
      });
    });
  }

  getDB() {
    if (this.type === 'supabase') {
      return this.supabase;
    } else {
      if (!this.db) {
        throw new Error('Database not initialized');
      }
      return this.db;
    }
  }

  getType() {
    return this.type;
  }
}

module.exports = new DatabaseManager();