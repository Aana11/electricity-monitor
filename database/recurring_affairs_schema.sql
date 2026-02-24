-- 周期事务模板表
CREATE TABLE IF NOT EXISTS recurring_affairs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  creator_id INTEGER NOT NULL,
  room_name TEXT NOT NULL,
  priority INTEGER DEFAULT 2,
  -- 周期类型: daily(每天), weekly(每周), monthly(每月), yearly(每年)
  recurrence_type TEXT NOT NULL,
  -- 周期值: 如每月15号为 "15", 每周一为 "1", 每天为 "*"
  recurrence_value TEXT NOT NULL,
  -- 截止时间偏移(小时): 创建后多少小时截止
  deadline_offset INTEGER DEFAULT 24,
  members TEXT, -- JSON数组,存储成员ID
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 周期事务生成记录表(记录已生成的实例,避免重复)
CREATE TABLE IF NOT EXISTS recurring_affair_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  generated_affair_id INTEGER,
  scheduled_date DATE NOT NULL,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(template_id, scheduled_date)
);
