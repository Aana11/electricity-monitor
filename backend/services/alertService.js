const db = require('../config/database');
const logger = require('../utils/logger');

// 获取用户预警设置
async function getAlertSettings(userId) {
  const settings = await db.get(
    'SELECT * FROM alert_settings WHERE user_id = ?',
    [userId]
  );
  
  if (!settings) {
    // 返回默认设置
    return {
      user_id: userId,
      enabled: 1,
      threshold_20: 1,
      threshold_10: 1,
      threshold_5: 1,
      push_browser: 1,
      push_email: 0,
      email: null,
      last_alert_balance: null,
      last_alert_time: null
    };
  }
  
  return settings;
}

// 更新预警设置
async function updateAlertSettings(userId, settings) {
  const existing = await db.get(
    'SELECT id FROM alert_settings WHERE user_id = ?',
    [userId]
  );
  
  if (existing) {
    await db.run(
      `UPDATE alert_settings SET
       enabled = ?,
       threshold_20 = ?,
       threshold_10 = ?,
       threshold_5 = ?,
       push_browser = ?,
       push_email = ?,
       email = ?,
       updated_at = datetime('now')
       WHERE user_id = ?`,
      [
        settings.enabled ? 1 : 0,
        settings.threshold_20 ? 1 : 0,
        settings.threshold_10 ? 1 : 0,
        settings.threshold_5 ? 1 : 0,
        settings.push_browser ? 1 : 0,
        settings.push_email ? 1 : 0,
        settings.email,
        userId
      ]
    );
  } else {
    await db.run(
      `INSERT INTO alert_settings
       (user_id, enabled, threshold_20, threshold_10, threshold_5, push_browser, push_email, email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        settings.enabled ? 1 : 0,
        settings.threshold_20 ? 1 : 0,
        settings.threshold_10 ? 1 : 0,
        settings.threshold_5 ? 1 : 0,
        settings.push_browser ? 1 : 0,
        settings.push_email ? 1 : 0,
        settings.email
      ]
    );
  }
  
  return true;
}

// 检查并触发预警
async function checkAndSendAlerts() {
  logger.info('🔔 开始检查余额预警...');
  
  // 获取所有启用预警的用户
  const users = await db.all(`
    SELECT u.id, u.school_account, u.real_name, u.room_name, s.*
    FROM users u
    JOIN alert_settings s ON u.id = s.user_id
    WHERE s.enabled = 1
  `);
  
  for (const user of users) {
    try {
      // 获取最新余额
      const record = await db.get(
        `SELECT balance, collected_at 
         FROM electricity_records 
         WHERE user_id = ? 
         ORDER BY collected_at DESC LIMIT 1`,
        [user.id]
      );
      
      if (!record) continue;
      
      const balance = record.balance;
      const thresholds = [];
      
      // 检查各个阈值
      if (user.threshold_20 && balance <= 20 && balance > 10) thresholds.push(20);
      if (user.threshold_10 && balance <= 10 && balance > 5) thresholds.push(10);
      if (user.threshold_5 && balance <= 5) thresholds.push(5);
      
      if (thresholds.length === 0) continue;
      
      // 检查是否已经发送过（避免重复发送）
      const lastAlert = user.last_alert_balance;
      const minThreshold = Math.min(...thresholds);
      
      // 如果上次预警的余额和现在差不多，就不重复发送
      if (lastAlert && Math.abs(lastAlert - balance) < 2) continue;
      
      // 更新最后预警记录
      await db.run(
        `UPDATE alert_settings 
         SET last_alert_balance = ?, last_alert_time = datetime('now')
         WHERE user_id = ?`,
        [balance, user.id]
      );
      
      // 记录预警日志
      await db.run(
        `INSERT INTO alert_logs (user_id, balance, threshold, alert_type, sent_at)
         VALUES (?, ?, ?, 'balance_low', datetime('now'))`,
        [user.id, balance, minThreshold]
      );
      
      logger.info(`✅ 余额预警: ${user.real_name} 余额 ¥${balance}, 触发阈值 ¥${minThreshold}`);
      
    } catch (error) {
      logger.error(`检查用户 ${user.id} 预警失败:`, error.message);
    }
  }
  
  logger.info('✅ 余额预警检查完成');
}

// 获取预警历史
async function getAlertHistory(userId, limit = 30) {
  return await db.all(
    `SELECT * FROM alert_logs 
     WHERE user_id = ? 
     ORDER BY sent_at DESC 
     LIMIT ?`,
    [userId, limit]
  );
}

module.exports = {
  getAlertSettings,
  updateAlertSettings,
  checkAndSendAlerts,
  getAlertHistory
};
