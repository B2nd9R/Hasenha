const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

// ⚙️ الإعدادات
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// 🔄 التحقق من وجود متغيرات Supabase
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.log('💡 Please check your .env file and make sure:');
  console.log('   - SUPABASE_URL is set');
  console.log('   - SUPABASE_ANON_KEY is set');
  process.exit(1);
}

// 🔄 تهيئة Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false // مهم لتطبيقات الخادم
    }
  }
);

// 🔧 وسائط أساسية
app.use(cors({
  origin: FRONTEND_URL
}));
app.use(express.json({ limit: '10kb' }));

// 📁 خدمة الملفات الثابتة (لصفحات HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '..')));

// ✅ دالة محسنة للتحقق من اتصال Supabase
async function testSupabaseConnection() {
  try {
    // محاولة تنفيذ استعلام بسيط بدلاً من فحص جدول محدد
    const { data, error } = await supabase
      .from('_supabase_schema')
      .select('*')
      .limit(1);
    
    if (error) {
      // تجاهل أخطاء الجدول غير الموجود
      if (error.code === '42P01' || error.message.includes('schema cache')) {
        console.log('ℹ️ Schema not initialized yet - this is normal for new projects');
        return true;
      }
      console.error('❌ Supabase connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    return false;
  }
}

// ✅ دالة لإنشاء الجدول إذا لم يكن موجوداً
async function ensureStatsTable() {
  try {
    const { data, error } = await supabase
      .from('stats')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (error && error.code === '42P01') {
      console.log('📊 Creating stats table...');
      
      // إنشاء الجدول باستخدام SQL مباشرة
      const { error: createError } = await supabase.rpc('create_stats_table_if_not_exists');
      
      if (createError) {
        console.log('⚠️ Could not create table via RPC, will create on first insert');
      }
      
      // محاولة إدراج السجل الافتراضي
      const { error: insertError } = await supabase
        .from('stats')
        .insert([
          { 
            id: 1, 
            total_generated: 0, 
            total_checked: 0 
          }
        ]);
      
      if (insertError && insertError.code !== '23505') { // تجاهل خطأ duplicate key
        console.error('❌ Error creating default stats record:', insertError);
      } else {
        console.log('✅ Default stats record created');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error ensuring stats table:', error);
    return false;
  }
}

// 🎯 مسارات API محدثة لـ Supabase

// تحديث الإحصاءات
app.post('/api/stats/update', async (req, res) => {
  const { action } = req.body;
  
  if (!action || (action !== 'generate' && action !== 'check')) {
    return res.status(400).json({
      error: 'Action must be "generate" or "check"'
    });
  }
  
  try {
    // 🔄 استخدام Supabase بدلاً من SQLite
    const column = action === 'generate' ? 'total_generated' : 'total_checked';
    
    // محاولة استخدام الدالة المخزنة أولاً
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('increment_stats', { 
        column_name: column 
      });
    
    if (rpcError) {
      // إذا فشلت الدالة المخزنة، استخدم update مباشر
      console.log('⚠️ RPC function not available, using direct update');
      
      const { data: currentData, error: fetchError } = await supabase
        .from('stats')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (fetchError) {
        // إذا الجدول غير موجود، أنشئه
        await ensureStatsTable();
      }
      
      const { error: updateError } = await supabase
        .from('stats')
        .update({ 
          [column]: (currentData?.[column] || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);
      
      if (updateError) throw updateError;
    }
    
    // جلب الإحصاءات المحدثة
    const { data: stats, error: statsError } = await supabase
      .from('stats')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (statsError) {
      // إذا فشل جلب البيانات، أرجع قيم افتراضية
      console.log('⚠️ Could not fetch updated stats, returning default values');
      res.json({
        success: true,
        stats: { 
          total_generated: action === 'generate' ? 1 : 0, 
          total_checked: action === 'check' ? 1 : 0, 
          updated_at: new Date().toISOString() 
        },
        message: `Statistics updated for: ${action}`
      });
    } else {
      res.json({
        success: true,
        stats: stats,
        message: `Statistics updated for: ${action}`
      });
    }
    
  } catch (error) {
    console.error('Supabase error:', error);
    res.status(500).json({ 
      error: 'Database update failed',
      details: error.message,
      code: 500
    });
  }
});

// الحصول على الإحصاءات
app.get('/api/stats', async (req, res) => {
  try {
    // 🔄 استخدام Supabase بدلاً من SQLite
    const { data, error } = await supabase
      .from('stats')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // لا توجد بيانات
        // أرجع قيم افتراضية
        res.json({
          success: true,
          stats: { 
            total_generated: 0, 
            total_checked: 0, 
            updated_at: new Date().toISOString() 
          }
        });
        return;
      }
      throw error;
    }
    
    res.json({
      success: true,
      stats: data || { 
        total_generated: 0, 
        total_checked: 0, 
        updated_at: new Date().toISOString() 
      }
    });
    
  } catch (error) {
    console.error('Supabase error:', error);
    res.status(500).json({ 
      error: 'Failed to get statistics',
      details: error.message,
      code: 500
    });
  }
});

// فحص كلمة المرور مع HIBP
app.post('/api/password/check', async (req, res) => {
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

  try {
    // استخدام k-Anonymity model - آمن ولا نرسل كلمة المرور كاملة
    const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);
    
    console.log(`🔍 Checking password with HIBP (prefix: ${prefix})`);
    
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'User-Agent': 'Hasenha-Password-Checker'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HIBP API error: ${response.status}`);
    }
    
    const data = await response.text();
    const found = data.includes(suffix);
    
    let count = 0;
    if (found) {
      const lines = data.split('\r\n');
      for (const line of lines) {
        if (line.startsWith(suffix)) {
          count = parseInt(line.split(':')[1]) || 1;
          break;
        }
      }
    }
    
    // 🔄 تحديث إحصاءات الفحص باستخدام Supabase
    try {
      await supabase.rpc('increment_stats', { 
        column_name: 'total_checked' 
      }).catch(async (rpcError) => {
        // إذا فشلت الدالة المخزنة، استخدم update مباشر
        console.log('⚠️ RPC failed, using direct update for stats');
        const { data: currentData } = await supabase
          .from('stats')
          .select('total_checked')
          .eq('id', 1)
          .single();
        
        await supabase
          .from('stats')
          .update({ 
            total_checked: (currentData?.total_checked || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', 1);
      });
    } catch (statsError) {
      console.log('⚠️ Could not update stats, but password check completed');
    }
    
    res.json({
      success: true,
      breached: found,
      count: count,
      message: found ? 
        `⚠️ تم العثور على كلمة المرور في ${count.toLocaleString()} اختراق` : 
        '✅ كلمة المرور آمنة - لم تتعرض للاختراق',
      hash: `${prefix}...` // للشفافية فقط
    });
    
  } catch (error) {
    console.error('🔴 HIBP Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'تعذر فحص كلمة المرور حالياً',
      breached: false,
      message: '⚠️ خدمة الفحص غير متاحة حالياً',
      code: 500
    });
  }
});

// 🏠 مسارات الصفحات - المسارات الصحيحة
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/check', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'check.html'));
});

app.get('/generate', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'generate.html'));
});

app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'privacy.html'));
});

app.get('/faq', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'faq.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'about.html'));
});

// 🏥 صفحة الصحة
app.get('/api/health', async (req, res) => {
  try {
    // اختبار اتصال Supabase
    const dbStatus = await testSupabaseConnection();
    
    res.json({ 
      status: 'OK', 
      message: 'Hasenha Backend is running securely',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      port: PORT,
      database: {
        type: 'Supabase',
        status: dbStatus ? 'Connected' : 'Error',
        url: process.env.SUPABASE_URL ? 'Configured' : 'Not configured'
      },
      system: {
        node: process.version,
        platform: process.platform,
        memory: process.memoryUsage()
      }
    });
    
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message,
      code: 500
    });
  }
});

// 🔧 صفحة معلومات النظام
app.get('/api/system/info', (req, res) => {
  res.json({
    supabase: {
      url: process.env.SUPABASE_URL ? '✅ Configured' : '❌ Not configured',
      anonKey: process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set',
      hasPassword: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('[YOUR_PASSWORD]') ? '❌ Needs update' : '✅ Configured'
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: PORT,
      frontendUrl: FRONTEND_URL
    }
  });
});

// ❌ معالجة المسارات غير الموجودة
app.use('*', (req, res) => {
  const fs = require('fs');
  let filePath = req.originalUrl;
  
  // إصلاح المسارات
  if (filePath === '/') {
    filePath = '/index.html';
  } else if (!filePath.includes('.')) {
    filePath += '.html';
  }
  
  const possibleFile = path.join(__dirname, '..', filePath);
  
  if (fs.existsSync(possibleFile)) {
    return res.sendFile(possibleFile);
  }
  
  res.status(404).json({
    error: 'Route not found',
    code: 404,
    requested: req.originalUrl,
    suggestion: 'Check /api/health for system status'
  });
});

// 🚨 معالجة الأخطاء
app.use((error, req, res, next) => {
  console.error('🚨 Server Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    code: 500,
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 🚀 تشغيل السيرفر
async function startServer() {
  try {
    // اختبار اتصال Supabase عند البدء
    console.log('🔗 Testing Supabase connection...');
    const connectionTest = await testSupabaseConnection();
    
    if (!connectionTest) {
      console.log('⚠️ Supabase connection has issues, but starting server anyway...');
      console.log('💡 Make sure to:');
      console.log('   1. Set database password in Supabase Dashboard');
      console.log('   2. Update DATABASE_URL in .env file');
      console.log('   3. Create stats table in SQL Editor');
    } else {
      // التأكد من وجود الجدول
      await ensureStatsTable();
    }
    
    app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log('🚀 HASENHA FULL-STACK STARTED SUCCESSFULLY');
      console.log('='.repeat(60));
      console.log(`📍 Backend Port: ${PORT}`);
      console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
      console.log(`🗄️ Database: Supabase Cloud`);
      console.log(`🔗 Supabase URL: ${process.env.SUPABASE_URL}`);
      console.log('='.repeat(60));
      console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
      console.log(`📈 API Stats: http://localhost:${PORT}/api/stats`);
      console.log(`🔍 Password Check: http://localhost:${PORT}/api/password/check`);
      console.log('='.repeat(60));
      console.log(`🏠 Home: http://localhost:${PORT}/`);
      console.log(`🔍 Check: http://localhost:${PORT}/check`);
      console.log(`🔧 Generate: http://localhost:${PORT}/generate`);
      console.log(`🔒 Privacy: http://localhost:${PORT}/privacy`);
      console.log(`❓ FAQ: http://localhost:${PORT}/faq`);
      console.log(`ℹ️ About: http://localhost:${PORT}/about`);
      console.log('='.repeat(60));
      console.log('✅ Ready to serve both API and Frontend!');
      
      if (!connectionTest) {
        console.log('⚠️ NOTE: Database needs configuration - check console messages above');
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// بدء السيرفر
startServer();