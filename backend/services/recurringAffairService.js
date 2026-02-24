const db = require('../config/database');
const logger = require('../utils/logger');

// 创建周期事务模板
async function createRecurringTemplate(templateData) {
  const { title, description, creatorId, roomName, priority, recurrenceType, recurrenceValue, deadlineOffset, members } = templateData;
  
  const result = await db.run(`
    INSERT INTO recurring_affairs 
    (title, description, creator_id, room_name, priority, recurrence_type, recurrence_value, deadline_offset, members)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [title, description, creatorId, roomName, priority, recurrenceType, recurrenceValue, deadlineOffset, JSON.stringify(members)]);
  
  return result.lastID;
}

// 获取周期事务模板列表
async function getRecurringTemplates(roomName) {
  return await db.all(`
    SELECT ra.*, u.real_name as creator_name
    FROM recurring_affairs ra
    LEFT JOIN users u ON ra.creator_id = u.id
    WHERE ra.room_name = ? AND ra.is_active = 1
    ORDER BY ra.created_at DESC
  `, [roomName]);
}

// 删除周期事务模板
async function deleteRecurringTemplate(id) {
  await db.run('UPDATE recurring_affairs SET is_active = 0 WHERE id = ?', [id]);
  return true;
}

// 生成今天的周期事务
async function generateTodayAffairs() {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const dayOfMonth = today.getDate();
  const dayOfWeek = today.getDay() || 7; // 1-7 (周一到周日)
  
  logger.info(`🔄 开始生成周期事务: ${dateStr}`);
  
  // 获取所有活跃的周期事务模板
  const templates = await db.all(`
    SELECT * FROM recurring_affairs 
    WHERE is_active = 1
  `);
  
  let generatedCount = 0;
  
  for (const template of templates) {
    try {
      // 检查是否需要生成今天的事务
      let shouldGenerate = false;
      
      switch (template.recurrence_type) {
        case 'daily':
          // 每天生成
          shouldGenerate = true;
          break;
        case 'weekly':
          // 每周特定星期几生成
          shouldGenerate = template.recurrence_value === String(dayOfWeek);
          break;
        case 'monthly':
          // 每月特定日期生成
          shouldGenerate = template.recurrence_value === String(dayOfMonth);
          break;
        case 'yearly':
          // 每年特定月日生成 (格式: MM-DD)
          const monthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`;
          shouldGenerate = template.recurrence_value === monthDay;
          break;
      }
      
      if (!shouldGenerate) continue;
      
      // 检查今天是否已经生成过
      const existing = await db.get(`
        SELECT * FROM recurring_affair_logs 
        WHERE template_id = ? AND scheduled_date = ?
      `, [template.id, dateStr]);
      
      if (existing) continue;
      
      // 计算截止时间
      const deadline = new Date(today);
      deadline.setHours(deadline.getHours() + (template.deadline_offset || 24));
      
      // 创建事务
      const members = JSON.parse(template.members || '[]');
      
      const affairResult = await db.run(`
        INSERT INTO dormitory_affairs 
        (title, description, creator_id, room_name, priority, deadline, status)
        VALUES (?, ?, ?, ?, ?, ?, 0)
      `, [
        template.title,
        template.description,
        template.creator_id,
        template.room_name,
        template.priority,
        deadline.toISOString()
      ]);
      
      const affairId = affairResult.lastID;
      
      // 添加成员
      for (const memberId of members) {
        await db.run(`
          INSERT INTO affair_members (affair_id, user_id)
          VALUES (?, ?)
        `, [affairId, memberId]);
      }
      
      // 记录生成日志
      await db.run(`
        INSERT INTO recurring_affair_logs (template_id, generated_affair_id, scheduled_date)
        VALUES (?, ?, ?)
      `, [template.id, affairId, dateStr]);
      
      generatedCount++;
      logger.info(`✅ 生成周期事务: ${template.title} (ID: ${affairId})`);
      
    } catch (error) {
      logger.error(`❌ 生成周期事务失败 (模板ID: ${template.id}):`, error.message);
    }
  }
  
  logger.info(`🔄 周期事务生成完成: ${generatedCount} 个`);
  return generatedCount;
}

// 获取周期类型文本
function getRecurrenceTypeText(type, value) {
  switch (type) {
    case 'daily':
      return '每天';
    case 'weekly':
      const weekDays = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      return `每${weekDays[value] || '周'}`;
    case 'monthly':
      return `每月${value}号`;
    case 'yearly':
      return `每年${value}`;
    default:
      return type;
  }
}

module.exports = {
  createRecurringTemplate,
  getRecurringTemplates,
  deleteRecurringTemplate,
  generateTodayAffairs,
  getRecurrenceTypeText
};
