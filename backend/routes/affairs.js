const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const affairService = require('../services/affairService');
const logger = require('../utils/logger');

// 获取宿舍事务列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const roomName = req.query.roomName || req.user.room;
    if (!roomName) {
      return res.status(400).json({ error: '未指定宿舍' });
    }
    
    const affairs = await affairService.getAffairsByRoom(roomName, req.user.userId);
    
    // 获取未读数
    const unreadCount = await affairService.getUnreadCount(req.user.userId);
    
    res.json({ 
      success: true, 
      data: affairs,
      unreadCount
    });
  } catch (error) {
    logger.error('获取事务列表失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

// 创建事务
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, priority, deadline, remindAt, members } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: '标题不能为空' });
    }
    
    const affairData = {
      title,
      description,
      creatorId: req.user.userId,
      roomName: req.user.room,
      priority: priority || 2,
      deadline,
      remindAt,
      members: members || []
    };
    
    const affairId = await affairService.createAffair(affairData);
    
    res.json({ 
      success: true, 
      message: '创建成功',
      data: { id: affairId }
    });
  } catch (error) {
    logger.error('创建事务失败:', error);
    res.status(500).json({ error: '创建失败' });
  }
});

// 获取事务详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const affair = await affairService.getAffairDetail(req.params.id);
    
    if (!affair) {
      return res.status(404).json({ error: '事务不存在' });
    }
    
    res.json({ success: true, data: affair });
  } catch (error) {
    logger.error('获取事务详情失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

// 更新事务
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, priority, deadline, remindAt, status } = req.body;
    
    await affairService.updateAffair(req.params.id, {
      title, description, priority, deadline, remindAt, status
    });
    
    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    logger.error('更新事务失败:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

// 删除事务
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await affairService.deleteAffair(req.params.id);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    logger.error('删除事务失败:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

// 标记已读
router.post('/:id/read', authMiddleware, async (req, res) => {
  try {
    await affairService.markAsRead(req.params.id, req.user.userId);
    res.json({ success: true, message: '标记成功' });
  } catch (error) {
    logger.error('标记已读失败:', error);
    res.status(500).json({ error: '标记失败' });
  }
});

// 获取同宿舍成员
router.get('/members/room', authMiddleware, async (req, res) => {
  try {
    const roomName = req.user.room;
    if (!roomName) {
      return res.status(400).json({ error: '未绑定宿舍' });
    }
    
    const members = await affairService.getRoomMembers(roomName, req.user.userId);
    res.json({ success: true, data: members });
  } catch (error) {
    logger.error('获取宿舍成员失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

module.exports = router;
