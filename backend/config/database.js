const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/database.sqlite');

// 创建数据库连接
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
  } else {
    console.log('✅ SQLite数据库连接成功');
    initDatabase();
  }
});

// 初始化数据库表
function initDatabase() {
  db.serialize(() => {
    // 用户表
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_account TEXT NOT NULL UNIQUE,
      school_password TEXT NOT NULL,
      real_name TEXT,
      gender INTEGER DEFAULT 0,
      mobile TEXT,
      room_id TEXT,
      room_name TEXT,
      device_no TEXT,
      is_active INTEGER DEFAULT 1,
      last_login_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 电费数据表
    db.run(`CREATE TABLE IF NOT EXISTS electricity_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      device_no TEXT NOT NULL,
      balance REAL NOT NULL,
      price REAL NOT NULL,
      remaining_kwh REAL NOT NULL,
      meter_reading_time DATETIME,
      collected_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 每日用电统计表
    db.run(`CREATE TABLE IF NOT EXISTS daily_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      device_no TEXT NOT NULL,
      date DATE NOT NULL,
      start_balance REAL,
      end_balance REAL,
      used_kwh REAL DEFAULT 0,
      used_amount REAL DEFAULT 0,
      record_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, device_no, date)
    )`);

    // 采集日志表
    db.run(`CREATE TABLE IF NOT EXISTS collection_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_name TEXT NOT NULL,
      status INTEGER NOT NULL,
      total_users INTEGER DEFAULT 0,
      success_count INTEGER DEFAULT 0,
      fail_count INTEGER DEFAULT 0,
      error_message TEXT,
      started_at DATETIME,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 预警设置表
    db.run(`CREATE TABLE IF NOT EXISTS alert_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      enabled INTEGER DEFAULT 1,
      threshold_20 INTEGER DEFAULT 1,
      threshold_10 INTEGER DEFAULT 1,
      threshold_5 INTEGER DEFAULT 1,
      push_browser INTEGER DEFAULT 1,
      push_email INTEGER DEFAULT 0,
      email TEXT,
      last_alert_balance REAL,
      last_alert_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 预警日志表
    db.run(`CREATE TABLE IF NOT EXISTS alert_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      balance REAL NOT NULL,
      threshold INTEGER NOT NULL,
      alert_type TEXT NOT NULL,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 宿舍事务表
    db.run(`CREATE TABLE IF NOT EXISTS dormitory_affairs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      creator_id INTEGER NOT NULL,
      room_name TEXT NOT NULL,
      priority INTEGER DEFAULT 2,
      status INTEGER DEFAULT 0,
      deadline DATETIME,
      remind_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 事务成员表
    db.run(`CREATE TABLE IF NOT EXISTS affair_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      affair_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      is_notified INTEGER DEFAULT 0,
      notified_at DATETIME,
      is_read INTEGER DEFAULT 0,
      read_at DATETIME,
      UNIQUE(affair_id, user_id)
    )`);

    // 事务提醒日志表
    db.run(`CREATE TABLE IF NOT EXISTS affair_reminder_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      affair_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      reminder_type TEXT,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status INTEGER DEFAULT 1
    )`);

    // 周期事务模板表
    db.run(`CREATE TABLE IF NOT EXISTS recurring_affairs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      creator_id INTEGER NOT NULL,
      room_name TEXT NOT NULL,
      priority INTEGER DEFAULT 2,
      recurrence_type TEXT NOT NULL,
      recurrence_value TEXT NOT NULL,
      deadline_offset INTEGER DEFAULT 24,
      members TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 周期事务生成记录表
    db.run(`CREATE TABLE IF NOT EXISTS recurring_affair_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      generated_affair_id INTEGER,
      scheduled_date DATE NOT NULL,
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(template_id, scheduled_date)
    )`);
  });
}

// 将db转换为Promise风格
const dbAsync = {
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

module.exports = dbAsync;
