const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const db = require('../config/database');
const logger = require('../utils/logger');

// 更改用户身份
router.post('/change-role', authMiddleware, async (req, res) => {
  try {
    const { newRole } = req.body;
    const userId = req.user.userId;
    
    if (!newRole || !['leader', 'member'].includes(newRole)) {
      return res.status(400).json({ error: '无效的身份' });
    }
    
    // 获取当前用户信息
    const currentUser = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!currentUser) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 如果身份没有变化
    if (currentUser.role === newRole) {
      return res.status(400).json({ error: '您已经是该身份' });
    }
    
    // 宿舍长降级为成员 - 允许
    if (currentUser.role === 'leader' && newRole === 'member') {
      await db.run(
        'UPDATE users SET role = ?, updated_at = datetime("now") WHERE id = ?',
        [newRole, userId]
      );
      
      return res.json({ 
        success: true, 
        message: '已成功将身份更改为宿舍成员',
        role: newRole
      });
    }
    
    // 成员升级为宿舍长 - 需要检查是否已有宿舍长
    if (currentUser.role === 'member' && newRole === 'leader') {
      const existingLeader = await db.get(
        "SELECT * FROM users WHERE room_name = ? AND role = 'leader' AND is_active = 1 AND id != ?",
        [currentUser.room_name, userId]
      );
      
      if (existingLeader) {
        return res.status(400).json({ 
          error: '该宿舍已有宿舍长，无法升级身份。如需更换宿舍长，请联系现任宿舍长先降级身份。' 
        });
      }
      
      await db.run(
        'UPDATE users SET role = ?, updated_at = datetime("now") WHERE id = ?',
        [newRole, userId]
      );
      
      return res.json({ 
        success: true, 
        message: '已成功将身份更改为宿舍长',
        role: newRole
      });
    }
    
  } catch (error) {
    logger.error('更改身份失败:', error);
    res.status(500).json({ error: '更改身份失败' });
  }
});

module.exports = router;