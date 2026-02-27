const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

// 发送测试邮件
router.post('/test', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: '请提供邮箱地址' });
    }
    
    const result = await emailService.sendTestEmail(email);
    
    if (result.success) {
      res.json({ success: true, message: '测试邮件发送成功' });
    } else {
      res.status(500).json({ error: '邮件发送失败: ' + result.error });
    }
  } catch (error) {
    console.error('发送测试邮件失败:', error);
    res.status(500).json({ error: '发送失败' });
  }
});

module.exports = router;
