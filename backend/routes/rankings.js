const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const electricityService = require('../services/electricityService');

// 获取余额排行榜（余额最低的优先）
router.get('/balance', async (req, res) => {
  try {
    const data = await electricityService.getRankings('balance');
    
    // 添加排名
    const ranked = data.map((item, index) => ({
      rank: index + 1,
      ...item
    }));
    
    res.json({ success: true, data: ranked });
  } catch (error) {
    res.status(500).json({ error: '获取排行榜失败' });
  }
});

// 获取用电排行榜（昨日用电最多的优先）
router.get('/usage', async (req, res) => {
  try {
    const data = await electricityService.getRankings('usage');
    
    // 添加排名
    const ranked = data.map((item, index) => ({
      rank: index + 1,
      ...item
    }));
    
    res.json({ success: true, data: ranked });
  } catch (error) {
    res.status(500).json({ error: '获取排行榜失败' });
  }
});

module.exports = router;
