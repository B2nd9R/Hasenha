-- إنشاء جدول الإحصاءات
CREATE TABLE IF NOT EXISTS stats (
  id SERIAL PRIMARY KEY,
  total_generated INTEGER DEFAULT 0,
  total_checked INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدخال السجل الافتراضي
INSERT INTO stats (id, total_generated, total_checked) 
VALUES (1, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- دوال لزيادة العدادات
CREATE OR REPLACE FUNCTION increment_generated()
RETURNS VOID AS $$
BEGIN
  UPDATE stats 
  SET total_generated = total_generated + 1, 
      updated_at = NOW()
  WHERE id = 1;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_checked()
RETURNS VOID AS $$
BEGIN
  UPDATE stats 
  SET total_checked = total_checked + 1, 
      updated_at = NOW()
  WHERE id = 1;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_stats(column_name TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('UPDATE stats SET %I = %I + 1, updated_at = NOW() WHERE id = 1', 
                column_name, column_name);
END;
$$ LANGUAGE plpgsql;