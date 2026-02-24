const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const recurringService = require('../services/recurringAffairService');
const logger = require('../utils/logger');

// 获取周期事务模板列表
router.get('/recurring', authMiddleware, async (req, res) => {
  try {
    const roomName = req.user.room;
    if (!roomName) {
      return res.status(400).json({ error: '未绑定宿舍' });
    }
    
    const templates = await recurringService.getRecurringTemplates(roomName);
    
    // 格式化显示文本
    const formatted = templates.map(t => ({
      ...t,
      recurrence_text: recurringService.getRecurrenceTypeText(t.recurrence_type, t.recurrence_value)
    }));
    
    res.json({ success: true, data: formatted });
  } catch (error) {
    logger.error('获取周期事务模板失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

// 创建周期事务模板
router.post('/recurring', authMiddleware, async (req, res) => {
  try {
    const { title, description, priority, recurrenceType, recurrenceValue, deadlineOffset, members } = req.body;
    
    if (!title || !recurrenceType || !recurrenceValue) {
      return res.status(400).json({ error: '请填写完整信息' });
    }
    
    const templateData = {
      title,
      description,
      creatorId: req.user.userId,
      roomName: req.user.room,
      priority: priority || 2,
      recurrenceType,
      recurrenceValue: String(recurrenceValue),
      deadlineOffset: deadlineOffset || 24,
      members: members || []
    };
    
    const templateId = await recurringService.createRecurringTemplate(templateData);
    
    res.json({ 
      success: true, 
      message: '创建成功',
      data: { id: templateId }
    });
  } catch (error) {
    logger.error('创建周期事务模板失败:', error);
    res.status(500).json({ error: '创建失败' });
  }
});

// 删除周期事务模板
router.delete('/recurring/:id', authMiddleware, async (req, res) => {
  try {
    await recurringService.deleteRecurringTemplate(req.params.id);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    logger.error('删除周期事务模板失败:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

// 手动触发生成今天的事务（仅管理员）
router.post('/recurring/generate', authMiddleware, async (req, res) => {
  try {
    const count = await recurringService.generateTodayAffairs();
    res.json({ success: true, message: `生成了 ${count} 个周期事务` });
  } catch (error) {
    logger.error('生成周期事务失败:', error);
    res.status(500).json({ error: '生成失败' });
  }
});

module.exports = router;
