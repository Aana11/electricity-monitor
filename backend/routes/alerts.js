const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const alertService = require('../services/alertService');
const db = require('../config/database');

// 获取预警设置
router.get('/settings', authMiddleware, async (req, res) => {
  try {
    const settings = await alertService.getAlertSettings(req.user.userId);
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ error: '获取设置失败' });
  }
});

// 更新预警设置
router.post('/settings', authMiddleware, async (req, res) => {
  try {
    await alertService.updateAlertSettings(req.user.userId, req.body);
    res.json({ success: true, message: '设置已更新' });
  } catch (error) {
    res.status(500).json({ error: '更新设置失败' });
  }
});

// 获取预警历史
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const history = await alertService.getAlertHistory(req.user.userId, limit);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ error: '获取历史失败' });
  }
});

// 手动触发检查（管理员）
router.post('/check', authMiddleware, async (req, res) => {
  try {
    await alertService.checkAndSendAlerts();
    res.json({ success: true, message: '检查完成' });
  } catch (error) {
    res.status(500).json({ error: '检查失败' });
  }
});

module.exports = router;
