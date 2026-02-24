-- 宿舍事务模块数据库表

-- 事务表
CREATE TABLE IF NOT EXISTS dormitory_affairs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  creator_id INTEGER NOT NULL,
  room_name TEXT NOT NULL,
  priority INTEGER DEFAULT 2, -- 1:高, 2:中, 3:低
  status INTEGER DEFAULT 0, -- 0:进行中, 1:已完成, 2:已取消
  deadline DATETIME,
  remind_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 事务成员表（记录哪些成员参与/被通知）
CREATE TABLE IF NOT EXISTS affair_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  affair_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  is_notified INTEGER DEFAULT 0, -- 是否已推送通知
  notified_at DATETIME,
  is_read INTEGER DEFAULT 0, -- 是否已读
  read_at DATETIME,
  UNIQUE(affair_id, user_id)
);

-- 事务提醒日志表
CREATE TABLE IF NOT EXISTS affair_reminder_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  affair_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  reminder_type TEXT, -- 'push', 'email', 'sms'
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status INTEGER DEFAULT 1 -- 1:成功, 0:失败
);
