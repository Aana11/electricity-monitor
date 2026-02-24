const db = require('../config/database');
const logger = require('../utils/logger');

// 获取用户宿舍的所有事务（包括已完成）
async function getAffairsByRoom(roomName, userId) {
  const affairs = await db.all(`
    SELECT 
      a.*,
      u.real_name as creator_name,
      CASE 
        WHEN a.deadline IS NULL THEN NULL
        WHEN datetime(a.deadline) < datetime('now') THEN 'expired'
        WHEN julianday(a.deadline) - julianday('now') <= 1 THEN 'urgent'
        WHEN julianday(a.deadline) - julianday('now') <= 3 THEN 'warning'
        ELSE 'normal'
      END as time_status
    FROM dormitory_affairs a
    LEFT JOIN users u ON a.creator_id = u.id
    WHERE a.room_name = ?
    ORDER BY 
      a.status ASC,
      CASE a.priority 
        WHEN 1 THEN 1 
        WHEN 2 THEN 2 
        ELSE 3 
      END,
      a.deadline ASC
  `, [roomName]);
  
  return affairs;
}

// 创建事务
async function createAffair(affairData) {
  const { title, description, creatorId, roomName, priority, deadline, remindAt, members } = affairData;
  
  const result = await db.run(`
    INSERT INTO dormitory_affairs (title, description, creator_id, room_name, priority, deadline, remind_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [title, description, creatorId, roomName, priority, deadline, remindAt]);
  
  const affairId = result.lastID;
  
  // 添加成员
  if (members && members.length > 0) {
    for (const memberId of members) {
      await db.run(`
        INSERT INTO affair_members (affair_id, user_id)
        VALUES (?, ?)
      `, [affairId, memberId]);
    }
  }
  
  return affairId;
}

// 更新事务
async function updateAffair(affairId, updateData) {
  const fields = [];
  const values = [];
  
  if (updateData.title !== undefined) {
    fields.push('title = ?');
    values.push(updateData.title);
  }
  if (updateData.description !== undefined) {
    fields.push('description = ?');
    values.push(updateData.description);
  }
  if (updateData.priority !== undefined) {
    fields.push('priority = ?');
    values.push(updateData.priority);
  }
  if (updateData.deadline !== undefined) {
    fields.push('deadline = ?');
    values.push(updateData.deadline);
  }
  if (updateData.remindAt !== undefined) {
    fields.push('remind_at = ?');
    values.push(updateData.remindAt);
  }
  if (updateData.status !== undefined) {
    fields.push('status = ?');
    values.push(updateData.status);
  }
  
  if (fields.length === 0) return true;
  
  fields.push("updated_at = datetime('now')");
  values.push(affairId);
  
  await db.run(`
    UPDATE dormitory_affairs 
    SET ${fields.join(', ')}
    WHERE id = ?
  `, values);
  
  return true;
}

// 删除事务
async function deleteAffair(affairId) {
  await db.run('DELETE FROM affair_members WHERE affair_id = ?', [affairId]);
  await db.run('DELETE FROM affair_reminder_logs WHERE affair_id = ?', [affairId]);
  await db.run('DELETE FROM dormitory_affairs WHERE id = ?', [affairId]);
  return true;
}

// 获取事务详情
async function getAffairDetail(affairId) {
  const affair = await db.get(`
    SELECT a.*, u.real_name as creator_name
    FROM dormitory_affairs a
    LEFT JOIN users u ON a.creator_id = u.id
    WHERE a.id = ?
  `, [affairId]);
  
  if (!affair) return null;
  
  // 获取成员列表
  const members = await db.all(`
    SELECT am.*, u.real_name, u.mobile
    FROM affair_members am
    LEFT JOIN users u ON am.user_id = u.id
    WHERE am.affair_id = ?
  `, [affairId]);
  
  return { ...affair, members };
}

// 标记已读
async function markAsRead(affairId, userId) {
  await db.run(`
    UPDATE affair_members 
    SET is_read = 1, read_at = datetime('now')
    WHERE affair_id = ? AND user_id = ?
  `, [affairId, userId]);
  return true;
}

// 获取需要提醒的事务
async function getPendingReminders() {
  const reminders = await db.all(`
    SELECT a.*, u.real_name as creator_name
    FROM dormitory_affairs a
    LEFT JOIN users u ON a.creator_id = u.id
    WHERE a.remind_at IS NOT NULL 
      AND a.remind_at <= datetime('now')
      AND a.status = 0
      AND NOT EXISTS (
        SELECT 1 FROM affair_reminder_logs arl 
        WHERE arl.affair_id = a.id 
        AND arl.reminder_type = 'push'
        AND date(arl.sent_at) = date('now')
      )
  `);
  
  return reminders;
}

// 获取同宿舍成员
async function getRoomMembers(roomName, excludeUserId = null) {
  let query = `
    SELECT id, real_name, mobile, room_name
    FROM users
    WHERE room_name = ? AND is_active = 1
  `;
  let params = [roomName];
  
  if (excludeUserId) {
    query += ' AND id != ?';
    params.push(excludeUserId);
  }
  
  return await db.all(query, params);
}

// 统计用户未读事务数
async function getUnreadCount(userId) {
  const result = await db.get(`
    SELECT COUNT(*) as count
    FROM affair_members
    WHERE user_id = ? AND is_read = 0
  `, [userId]);
  
  return result ? result.count : 0;
}

module.exports = {
  getAffairsByRoom,
  createAffair,
  updateAffair,
  deleteAffair,
  getAffairDetail,
  markAsRead,
  getPendingReminders,
  getRoomMembers,
  getUnreadCount
};
