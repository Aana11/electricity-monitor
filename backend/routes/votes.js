const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const db = require('../config/database');
const logger = require('../utils/logger');

// ===== 投票相关 API =====

// 获取投票列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userStr = JSON.stringify(req.user);
    logger.info('获取投票列表, req.user: ' + userStr);
    
    let roomName = req.user?.room || req.user?.roomName;
    logger.info('room from token: ' + roomName);
    
    // 如果token中没有room，从数据库获取
    if (!roomName) {
      const userId = req.user?.userId || req.user?.id;
      logger.info('token中没有room，查询数据库, userId: ' + userId);
      if (userId) {
        const user = await db.get('SELECT room_name FROM users WHERE id = ?', [userId]);
        if (user) {
          roomName = user.room_name;
          logger.info('从数据库获取room: ' + roomName);
        }
      }
    }
    
    if (!roomName) {
      return res.status(400).json({ error: '未绑定宿舍' });
    }

    const votes = await db.all(`
      SELECT v.*, u.real_name as creator_name,
        (SELECT COUNT(*) FROM vote_records WHERE vote_id = v.id) as vote_count,
        (SELECT COUNT(*) FROM vote_options WHERE vote_id = v.id) as option_count
      FROM votes v
      LEFT JOIN users u ON v.creator_id = u.id
      WHERE v.room_name = ?
      ORDER BY v.created_at DESC
    `, [roomName]);

    logger.info('投票列表:', votes);

    // 获取每个投票的选项
    for (const vote of votes) {
      const options = await db.all(`
        SELECT vo.*, 
          (SELECT COUNT(*) FROM vote_records WHERE option_id = vo.id) as vote_count
        FROM vote_options vo
        WHERE vo.vote_id = ?
        ORDER BY vo.sort_order
      `, [vote.id]);
      vote.options = options;
      
      // 获取用户是否已投票
      const userVote = await db.get(`
        SELECT option_id FROM vote_records 
        WHERE vote_id = ? AND user_id = ?
      `, [vote.id, req.user.userId]);
      vote.user_voted = userVote ? userVote.option_id : null;
    }

    res.json({ success: true, data: votes });
  } catch (error) {
    logger.error('获取投票列表失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

// 创建投票
router.post('/', authMiddleware, async (req, res) => {
  try {
    logger.info('=== 创建投票请求 ===');
    logger.info('User from token: ' + JSON.stringify(req.user));
    
    let roomName = req.user?.room || req.user?.roomName;
    const userId = req.user?.userId || req.user?.id;
    
    if (!roomName && userId) {
      const user = await db.get('SELECT room_name FROM users WHERE id = ?', [userId]);
      if (user) {
        roomName = user.room_name;
      }
    }
    
    const { title, description, type, options, require_majority, members } = req.body;
    
    if (!title || !options || options.length < 2) {
      return res.status(400).json({ error: '标题和至少2个选项是必须的' });
    }

    const membersJson = members ? JSON.stringify(members) : null;
    logger.info('membersJson:', membersJson);

    const result = await db.run(`
      INSERT INTO votes (title, description, type, creator_id, room_name, require_majority, members)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [title, description || '', type || 'single', userId, roomName, require_majority ? 1 : 0, membersJson]);

    const voteId = result.lastID;

    // 添加选项
    for (let i = 0; i < options.length; i++) {
      await db.run(`
        INSERT INTO vote_options (vote_id, content, sort_order)
        VALUES (?, ?, ?)
      `, [voteId, options[i], i]);
    }

    res.json({ success: true, message: '创建成功', data: { id: voteId } });
  } catch (error) {
    logger.error('创建投票失败:', error);
    res.status(500).json({ error: '创建失败' });
  }
});

// 投票
router.post('/:id/vote', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { option_id } = req.body;

    // 检查投票是否存在
    const vote = await db.get('SELECT * FROM votes WHERE id = ?', [id]);
    if (!vote) {
      return res.status(404).json({ error: '投票不存在' });
    }

    if (vote.status === 1) {
      return res.status(400).json({ error: '投票已结束' });
    }

    // 检查用户是否在参与成员列表中
    if (vote.members) {
      const allowedMembers = JSON.parse(vote.members);
      if (allowedMembers.length > 0 && !allowedMembers.includes(req.user.userId)) {
        return res.status(403).json({ error: '您不在投票参与成员中' });
      }
    }

    // 检查用户是否已投票
    const existingVote = await db.get(`
      SELECT * FROM vote_records WHERE vote_id = ? AND user_id = ?
    `, [id, req.user.userId]);

    if (existingVote) {
      return res.status(400).json({ error: '您已投票' });
    }

    // 记录投票
    await db.run(`
      INSERT INTO vote_records (vote_id, option_id, user_id)
      VALUES (?, ?, ?)
    `, [id, option_id, req.user.userId]);

    // 检查是否需要自动结束投票
    const totalOptions = await db.get('SELECT COUNT(*) as count FROM vote_options WHERE vote_id = ?', [id]);
    const totalVotes = await db.get('SELECT COUNT(*) as count FROM vote_records WHERE vote_id = ?', [id]);
    const roomMembers = await db.get('SELECT COUNT(*) as count FROM users WHERE room_name = ? AND is_active = 1', [vote.room_name]);

    // 如果投票人数达到房间人数的半数，结束投票
    if (vote.require_majority && totalVotes.count >= Math.ceil(roomMembers.count / 2)) {
      await db.run('UPDATE votes SET status = 1, updated_at = datetime("now") WHERE id = ?', [id]);
    }

    res.json({ success: true, message: '投票成功' });
  } catch (error) {
    logger.error('投票失败:', error);
    res.status(500).json({ error: '投票失败' });
  }
});

// 结束投票
router.put('/:id/close', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const vote = await db.get('SELECT * FROM votes WHERE id = ?', [id]);
    if (!vote) {
      return res.status(404).json({ error: '投票不存在' });
    }

    if (vote.creator_id !== req.user.userId) {
      return res.status(403).json({ error: '只有发起人可以结束投票' });
    }

    await db.run('UPDATE votes SET status = 1, updated_at = datetime("now") WHERE id = ?', [id]);

    res.json({ success: true, message: '投票已结束' });
  } catch (error) {
    logger.error('结束投票失败:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

// 删除投票
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const vote = await db.get('SELECT * FROM votes WHERE id = ?', [id]);
    if (!vote) {
      return res.status(404).json({ error: '投票不存在' });
    }

    // 只有创建者或宿舍长可以删除
    if (vote.creator_id !== req.user.userId && req.user.role !== 'leader') {
      return res.status(403).json({ error: '只有创建者或宿舍长可以删除投票' });
    }

    // 删除相关记录
    await db.run('DELETE FROM vote_records WHERE vote_id = ?', [id]);
    await db.run('DELETE FROM vote_options WHERE vote_id = ?', [id]);
    await db.run('DELETE FROM votes WHERE id = ?', [id]);

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    logger.error('删除投票失败:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

// 编辑投票
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, options } = req.body;

    const vote = await db.get('SELECT * FROM votes WHERE id = ?', [id]);
    if (!vote) {
      return res.status(404).json({ error: '投票不存在' });
    }

    if (vote.creator_id !== req.user.userId) {
      return res.status(403).json({ error: '只有发起人可以编辑投票' });
    }

    if (vote.status === 1) {
      return res.status(400).json({ error: '已结束的投票不能编辑' });
    }

    // 检查是否已有投票记录
    const voteCount = await db.get('SELECT COUNT(*) as count FROM vote_records WHERE vote_id = ?', [id]);
    if (voteCount.count > 0) {
      return res.status(400).json({ error: '已有投票记录，不能编辑' });
    }

    // 更新投票
    await db.run(`
      UPDATE votes SET title = ?, description = ?, updated_at = datetime('now') WHERE id = ?
    `, [title, description || '', id]);

    // 删除旧选项
    await db.run('DELETE FROM vote_options WHERE vote_id = ?', [id]);

    // 添加新选项
    for (let i = 0; i < options.length; i++) {
      await db.run(`
        INSERT INTO vote_options (vote_id, content, sort_order)
        VALUES (?, ?, ?)
      `, [id, options[i], i]);
    }

    res.json({ success: true, message: '修改成功' });
  } catch (error) {
    logger.error('编辑投票失败:', error);
    res.status(500).json({ error: '修改失败' });
  }
});

// 获取单个投票详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const vote = await db.get(`
      SELECT v.*, u.real_name as creator_name
      FROM votes v
      LEFT JOIN users u ON v.creator_id = u.id
      WHERE v.id = ?
    `, [id]);
    
    if (!vote) {
      return res.status(404).json({ error: '投票不存在' });
    }
    
    const options = await db.all(`
      SELECT vo.*, 
        (SELECT COUNT(*) FROM vote_records WHERE option_id = vo.id) as vote_count
      FROM vote_options vo
      WHERE vo.vote_id = ?
      ORDER BY vo.sort_order
    `, [id]);
    
    vote.options = options;
    
    // 获取用户是否已投票
    const userVote = await db.get(`
      SELECT option_id FROM vote_records 
      WHERE vote_id = ? AND user_id = ?
    `, [id, req.user.userId]);
    vote.user_voted = userVote ? userVote.option_id : null;
    
    // 获取投票记录
    const records = await db.all(`
      SELECT vr.*, u.real_name as voter_name
      FROM vote_records vr
      LEFT JOIN users u ON vr.user_id = u.id
      WHERE vr.vote_id = ?
    `, [id]);
    vote.records = records;
    
    // 计算总票数
    vote.vote_count = records.length;
    
    res.json({ success: true, data: vote });
  } catch (error) {
    logger.error('获取投票详情失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

// 获取单个分工详情
router.get('/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await db.get(`
      SELECT t.*, u.real_name as creator_name
      FROM tasks t
      LEFT JOIN users u ON t.creator_id = u.id
      WHERE t.id = ?
    `, [id]);
    
    if (!task) {
      return res.status(404).json({ error: '分工不存在' });
    }
    
    const options = await db.all(`
      SELECT to.*, u.real_name as assigned_name
      FROM task_options to
      LEFT JOIN users u ON to.assigned_to = u.id
      WHERE to.task_id = ?
      ORDER BY to.sort_order
    `, [id]);
    
    task.options = options;
    
    // 获取用户是否已选择
    const userChoice = await db.get(`
      SELECT option_id FROM task_records 
      WHERE task_id = ? AND user_id = ?
    `, [id, req.user.userId]);
    task.user_chosen = userChoice ? userChoice.option_id : null;
    
    // 获取分工记录
    const records = await db.all(`
      SELECT tr.*, u.real_name as chooser_name
      FROM task_records tr
      LEFT JOIN users u ON tr.user_id = u.id
      WHERE tr.task_id = ?
    `, [id]);
    task.records = records;
    
    res.json({ success: true, data: task });
  } catch (error) {
    logger.error('获取分工详情失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

// ===== 分工相关 API =====

// 获取分工列表
router.get('/tasks', authMiddleware, async (req, res) => {
  try {
    let roomName = req.user.room;
    if (!roomName) {
      const user = await db.get('SELECT room_name FROM users WHERE id = ?', [req.user.userId]);
      if (user) roomName = user.room_name;
    }
    if (!roomName) {
      return res.status(400).json({ error: '未绑定宿舍' });
    }

    const tasks = await db.all(`
      SELECT t.*, u.real_name as creator_name,
        (SELECT COUNT(*) FROM task_options WHERE task_id = t.id) as option_count
      FROM tasks t
      LEFT JOIN users u ON t.creator_id = u.id
      WHERE t.room_name = ?
      ORDER BY t.created_at DESC
    `, [roomName]);

    // 获取每个分工的选项
    for (const task of tasks) {
      const options = await db.all(`
        SELECT to.*, u.real_name as assigned_name
        FROM task_options to
        LEFT JOIN users u ON to.assigned_to = u.id
        WHERE to.task_id = ?
        ORDER BY to.sort_order
      `, [task.id]);
      task.options = options;
      
      // 获取用户是否已选择
      const userChoice = await db.get(`
        SELECT option_id FROM task_records 
        WHERE task_id = ? AND user_id = ?
      `, [task.id, req.user.userId]);
      task.user_chosen = userChoice ? userChoice.option_id : null;
    }

    res.json({ success: true, data: tasks });
  } catch (error) {
    logger.error('获取分工列表失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

// 创建分工
router.post('/tasks', authMiddleware, async (req, res) => {
  try {
    const { title, description, options, members } = req.body;
    
    if (!title || !options || options.length < 1) {
      return res.status(400).json({ error: '标题和至少1个选项是必须的' });
    }

    let roomName = req.user.room;
    if (!roomName) {
      const user = await db.get('SELECT room_name FROM users WHERE id = ?', [req.user.userId]);
      if (user) roomName = user.room_name;
    }

    const membersJson = members ? JSON.stringify(members) : null;

    const result = await db.run(`
      INSERT INTO tasks (title, description, creator_id, room_name, members)
      VALUES (?, ?, ?, ?, ?)
    `, [title, description || '', req.user.userId, roomName, membersJson]);

    const taskId = result.lastID;

    // 添加选项
    for (let i = 0; i < options.length; i++) {
      await db.run(`
        INSERT INTO task_options (task_id, content, sort_order)
        VALUES (?, ?, ?)
      `, [taskId, options[i], i]);
    }

    res.json({ success: true, message: '创建成功', data: { id: taskId } });
  } catch (error) {
    logger.error('创建分工失败:', error);
    res.status(500).json({ error: '创建失败' });
  }
});

// 选择分工
router.post('/tasks/:id/choose', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { option_id } = req.body;

    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!task) {
      return res.status(404).json({ error: '分工不存在' });
    }

    if (task.status === 1) {
      return res.status(400).json({ error: '分工已结束' });
    }

    // 检查用户是否在参与成员列表中
    if (task.members) {
      const allowedMembers = JSON.parse(task.members);
      if (allowedMembers.length > 0 && !allowedMembers.includes(req.user.userId)) {
        return res.status(403).json({ error: '您不在分工参与成员中' });
      }
    }

    // 检查用户是否已选择
    const existingChoice = await db.get(`
      SELECT * FROM task_records WHERE task_id = ? AND user_id = ?
    `, [id, req.user.userId]);

    if (existingChoice) {
      return res.status(400).json({ error: '您已选择' });
    }

    // 记录选择
    await db.run(`
      INSERT INTO task_records (task_id, option_id, user_id)
      VALUES (?, ?, ?)
    `, [id, option_id, req.user.userId]);

    // 更新选项的 assigned_to
    await db.run('UPDATE task_options SET assigned_to = ? WHERE id = ?', [req.user.userId, option_id]);

    // 检查是否所有房间成员都已选择
    const roomMembers = await db.get('SELECT COUNT(*) as count FROM users WHERE room_name = ? AND is_active = 1', [task.room_name]);
    const totalChoices = await db.get('SELECT COUNT(*) as count FROM task_records WHERE task_id = ?', [id]);

    // 如果所有人都选择了，结束分工
    if (totalChoices.count >= roomMembers.count) {
      await db.run('UPDATE tasks SET status = 1, updated_at = datetime("now") WHERE id = ?', [id]);
    }

    res.json({ success: true, message: '选择成功' });
  } catch (error) {
    logger.error('选择分工失败:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

// 结束分工
router.put('/tasks/:id/close', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!task) {
      return res.status(404).json({ error: '分工不存在' });
    }

    if (task.creator_id !== req.user.userId) {
      return res.status(403).json({ error: '只有发起人可以结束分工' });
    }

    await db.run('UPDATE tasks SET status = 1, updated_at = datetime("now") WHERE id = ?', [id]);

    res.json({ success: true, message: '分工已结束' });
  } catch (error) {
    logger.error('结束分工失败:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

// 删除分工
router.delete('/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!task) {
      return res.status(404).json({ error: '分工不存在' });
    }

    // 只有创建者或宿舍长可以删除
    if (task.creator_id !== req.user.userId && req.user.role !== 'leader') {
      return res.status(403).json({ error: '只有创建者或宿舍长可以删除分工' });
    }

    // 删除相关记录
    await db.run('DELETE FROM task_records WHERE task_id = ?', [id]);
    await db.run('DELETE FROM task_options WHERE task_id = ?', [id]);
    await db.run('DELETE FROM tasks WHERE id = ?', [id]);

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    logger.error('删除分工失败:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

// 编辑分工
router.put('/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, options } = req.body;

    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!task) {
      return res.status(404).json({ error: '分工不存在' });
    }

    if (task.creator_id !== req.user.userId) {
      return res.status(403).json({ error: '只有发起人可以编辑分工' });
    }

    if (task.status === 1) {
      return res.status(400).json({ error: '已完成的分工不能编辑' });
    }

    // 检查是否有人选择
    const hasSelection = await db.get(`
      SELECT COUNT(*) as count FROM task_options 
      WHERE task_id = ? AND assigned_to IS NOT NULL
    `, [id]);
    if (hasSelection.count > 0) {
      return res.status(400).json({ error: '已有人选择分工，不能编辑' });
    }

    // 更新分工
    await db.run(`
      UPDATE tasks SET title = ?, description = ?, updated_at = datetime('now') WHERE id = ?
    `, [title, description || '', id]);

    // 删除旧选项
    await db.run('DELETE FROM task_options WHERE task_id = ?', [id]);

    // 添加新选项
    for (let i = 0; i < options.length; i++) {
      await db.run(`
        INSERT INTO task_options (task_id, content, sort_order)
        VALUES (?, ?, ?)
      `, [id, options[i], i]);
    }

    res.json({ success: true, message: '修改成功' });
  } catch (error) {
    logger.error('编辑分工失败:', error);
    res.status(500).json({ error: '修改失败' });
  }
});

module.exports = router;
