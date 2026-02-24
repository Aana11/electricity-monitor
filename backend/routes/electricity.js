const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const electricityService = require('../services/electricityService');
const db = require('../config/database');

// 获取当前电费数据
router.get('/current', authMiddleware, async (req, res) => {
  try {
    const data = await electricityService.getUserCurrentData(req.user.userId);
    
    if (!data) {
      return res.status(404).json({ error: '暂无数据' });
    }
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: '获取数据失败' });
  }
});

// 获取历史数据
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const data = await electricityService.getUserHistory(req.user.userId, days);
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: '获取历史数据失败' });
  }
});

// 获取每日用电统计
router.get('/daily-usage', authMiddleware, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    
    const data = await db.all(
      `SELECT * FROM daily_usage 
       WHERE user_id = ? 
       AND date >= date('now', '-${days} days')
       ORDER BY date DESC`
    , [req.user.userId]);
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: '获取每日用电统计失败' });
  }
});

// 手动刷新数据
router.post('/refresh', authMiddleware, async (req, res) => {
  try {
    const user = await db.get(
      'SELECT * FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const result = await electricityService.collectUserData(user);
    
    if (result.success) {
      const data = await electricityService.getUserCurrentData(req.user.userId);
      res.json({ success: true, data });
    } else {
      res.status(500).json({ error: result.error || '刷新失败' });
    }
  } catch (error) {
    res.status(500).json({ error: '刷新数据失败' });
  }
});

// 获取用电分析
router.get('/analysis', authMiddleware, async (req, res) => {
  try {
    const dailyData = await db.all(
      `SELECT date, used_kwh, used_amount 
       FROM daily_usage 
       WHERE user_id = ? 
       AND date >= date('now', '-7 days')
       ORDER BY date ASC`,
      [req.user.userId]
    );
    
    const avgUsage = dailyData.length > 0 
      ? dailyData.reduce((sum, d) => sum + d.used_kwh, 0) / dailyData.length 
      : 0;
    
    const current = await electricityService.getUserCurrentData(req.user.userId);
    
    res.json({
      success: true,
      data: {
        dailyUsage: dailyData,
        averageDailyKwh: parseFloat(avgUsage.toFixed(2)),
        current
      }
    });
  } catch (error) {
    res.status(500).json({ error: '获取分析数据失败' });
  }
});

module.exports = router;
