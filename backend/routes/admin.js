const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const electricityService = require('../services/electricityService');
const db = require('../config/database');

// 获取所有用户（管理员）
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const users = await db.all(`
      SELECT u.id, u.school_account, u.real_name, u.room_name, u.is_active, 
              u.last_login_at, u.created_at,
              r.balance, r.collected_at as last_data_time
       FROM users u
       LEFT JOIN (
         SELECT user_id, balance, collected_at
         FROM electricity_records
         WHERE id IN (
           SELECT MAX(id) FROM electricity_records GROUP BY user_id
         )
       ) r ON u.id = r.user_id
       ORDER BY u.created_at DESC
    `);
    
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// 手动触发数据采集
router.post('/collect', authMiddleware, async (req, res) => {
  try {
    const result = await electricityService.collectAllUsersData();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: '数据采集失败' });
  }
});

// 获取采集日志
router.get('/logs', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    const logs = await db.all(
      `SELECT * FROM collection_logs 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [limit]
    );
    
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ error: '获取日志失败' });
  }
});

module.exports = router;
