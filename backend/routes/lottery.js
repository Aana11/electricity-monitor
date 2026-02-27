const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const db = require('../config/database');
const logger = require('../utils/logger');

// 获取抽签列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const draws = await db.all(`
      SELECT d.*, u.real_name as creator_name,
        (SELECT COUNT(*) FROM lottery_items WHERE draw_id = d.id) as item_count,
        (SELECT COUNT(*) FROM lottery_participants WHERE draw_id = d.id) as participant_count
      FROM lottery_draws d
      LEFT JOIN users u ON d.creator_id = u.id
      WHERE d.room_name = ?
      ORDER BY d.created_at DESC
    `, [req.user.roomName]);
    
    res.json({ success: true, data: draws });
  } catch (error) {
    logger.error('获取抽签列表失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

// 创建抽签
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, items, participant_ids } = req.body;
    
    if (!title || !items || items.length < 1) {
      return res.status(400).json({ error: '请填写完整信息' });
    }
    
    if (!participant_ids || participant_ids.length < 1) {
      return res.status(400).json({ error: '请选择参与抽签的成员' });
    }
    
    if (items.length !== participant_ids.length) {
      return res.status(400).json({ error: '抽签项目数量必须与参与人数相同' });
    }
    
    // 创建抽签
    const drawResult = await db.run(`
      INSERT INTO lottery_draws (creator_id, room_name, title, description)
      VALUES (?, ?, ?, ?)
    `, [req.user.userId, req.user.roomName, title, description || '']);
    
    const drawId = drawResult.lastID;
    
    // 添加抽签项目
    for (let i = 0; i < items.length; i++) {
      await db.run(`
        INSERT INTO lottery_items (draw_id, content, sort_order)
        VALUES (?, ?, ?)
      `, [drawId, items[i], i]);
    }
    
    // 添加参与者
    for (const userId of participant_ids) {
      const user = await db.get('SELECT real_name FROM users WHERE id = ?', [userId]);
      await db.run(`
        INSERT INTO lottery_participants (draw_id, user_id, real_name)
        VALUES (?, ?, ?)
      `, [drawId, userId, user?.real_name || '']);
    }
    
    res.json({ success: true, message: '创建成功', data: { id: drawId } });
  } catch (error) {
    logger.error('创建抽签失败:', error);
    res.status(500).json({ error: '创建失败' });
  }
});

// 执行随机抽签
router.post('/:id/draw', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const draw = await db.get('SELECT * FROM lottery_draws WHERE id = ?', [id]);
    if (!draw) {
      return res.status(404).json({ error: '抽签不存在' });
    }
    
    if (draw.status === 1) {
      return res.status(400).json({ error: '抽签已完成' });
    }
    
    // 只有创建者或宿舍长可以执行抽签
    if (draw.creator_id !== req.user.userId && req.user.role !== 'leader') {
      return res.status(403).json({ error: '只有创建者或宿舍长可以执行抽签' });
    }
    
    // 获取所有项目和参与者
    const items = await db.all('SELECT * FROM lottery_items WHERE draw_id = ?', [id]);
    const participants = await db.all('SELECT * FROM lottery_participants WHERE draw_id = ?', [id]);
    
    if (items.length !== participants.length) {
      return res.status(400).json({ error: '项目数量与参与人数不匹配' });
    }
    
    // 随机打乱数组（Fisher-Yates 算法）
    const shuffled = [...participants];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // 分配结果
    const results = [];
    for (let i = 0; i < items.length; i++) {
      await db.run(`
        INSERT INTO lottery_results (draw_id, item_id, user_id, real_name)
        VALUES (?, ?, ?, ?)
      `, [id, items[i].id, shuffled[i].user_id, shuffled[i].real_name]);
      
      results.push({
        item: items[i].content,
        user: shuffled[i].real_name
      });
    }
    
    // 更新抽签状态
    await db.run(`
      UPDATE lottery_draws 
      SET status = 1, result = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [JSON.stringify(results), id]);
    
    res.json({ success: true, message: '抽签完成', data: results });
  } catch (error) {
    logger.error('抽签失败:', error);
    res.status(500).json({ error: '抽签失败' });
  }
});

// 获取抽签详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const draw = await db.get(`
      SELECT d.*, u.real_name as creator_name
      FROM lottery_draws d
      LEFT JOIN users u ON d.creator_id = u.id
      WHERE d.id = ?
    `, [id]);
    
    if (!draw) {
      return res.status(404).json({ error: '抽签不存在' });
    }
    
    const items = await db.all('SELECT * FROM lottery_items WHERE draw_id = ?', [id]);
    const participants = await db.all('SELECT * FROM lottery_participants WHERE draw_id = ?', [id]);
    const results = await db.all(`
      SELECT r.*, i.content as item_content
      FROM lottery_results r
      JOIN lottery_items i ON r.item_id = i.id
      WHERE r.draw_id = ?
    `, [id]);
    
    res.json({
      success: true,
      data: {
        ...draw,
        items,
        participants,
        results
      }
    });
  } catch (error) {
    logger.error('获取抽签详情失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

// 删除抽签（只有宿舍长可以删除）
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const draw = await db.get('SELECT * FROM lottery_draws WHERE id = ?', [id]);
    if (!draw) {
      return res.status(404).json({ error: '抽签不存在' });
    }
    
    // 只有宿舍长可以删除
    if (req.user.role !== 'leader') {
      return res.status(403).json({ error: '只有宿舍长可以删除抽签' });
    }
    
    await db.run('DELETE FROM lottery_draws WHERE id = ?', [id]);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    logger.error('删除抽签失败:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

module.exports = router;