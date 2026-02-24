-- 数据库性能优化索引

-- 电费记录表索引
CREATE INDEX IF NOT EXISTS idx_electricity_user_time 
ON electricity_records(user_id, collected_at DESC);

CREATE INDEX IF NOT EXISTS idx_electricity_device_time 
ON electricity_records(device_no, collected_at DESC);

-- 每日用电统计表索引
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date 
ON daily_usage(user_id, date DESC);

-- 事务表索引
CREATE INDEX IF NOT EXISTS idx_affairs_room_status 
ON dormitory_affairs(room_name, status);

CREATE INDEX IF NOT EXISTS idx_affairs_creator 
ON dormitory_affairs(creator_id);

CREATE INDEX IF NOT EXISTS idx_affairs_deadline 
ON dormitory_affairs(deadline);

-- 事务成员表索引
CREATE INDEX IF NOT EXISTS idx_affair_members_user 
ON affair_members(user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_affair_members_affair 
ON affair_members(affair_id);

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_room 
ON users(room_name, is_active);

CREATE INDEX IF NOT EXISTS idx_users_account 
ON users(school_account);

-- 预警日志表索引
CREATE INDEX IF NOT EXISTS idx_alert_logs_user 
ON alert_logs(user_id, sent_at DESC);

-- 周期事务表索引
CREATE INDEX IF NOT EXISTS idx_recurring_affairs_room 
ON recurring_affairs(room_name, is_active);
