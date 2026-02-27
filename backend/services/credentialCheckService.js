const db = require('../config/database');
const electricityService = require('./electricityService');
const emailService = require('./emailService');
const logger = require('../utils/logger');

// 检查所有用户的学校账号状态
async function checkAllUsersCredentials() {
  try {
    logger.info('开始检查用户凭证状态...');
    
    // 获取所有活跃用户
    const users = await db.all(`
      SELECT id, school_account, school_password, real_name, email, mobile
      FROM users 
      WHERE is_active = 1
    `);
    
    logger.info(`需要检查 ${users.length} 个用户`);
    
    for (const user of users) {
      try {
        // 尝试验证学校账号
        const verifyResult = await electricityService.verifySchoolCredentials(
          user.school_account, 
          user.school_password
        );
        
        if (!verifyResult.success) {
          logger.warn(`用户 ${user.real_name}(${user.school_account}) 凭证失效`);
          
          // 标记用户为凭证失效
          await db.run(`
            UPDATE users 
            SET credential_valid = 0, 
                credential_error = ?,
                updated_at = datetime('now')
            WHERE id = ?
          `, [verifyResult.message, user.id]);
          
          // 发送邮件通知
          if (user.email) {
            await emailService.sendCredentialExpiredNotification(
              user.email,
              user.real_name,
              user.school_account
            );
          }
          
          // 记录通知日志
          await db.run(`
            INSERT INTO email_notifications (user_id, type, title, content)
            VALUES (?, 'credential_expired', '账号凭证失效提醒', ?)
          `, [user.id, `您的学校账号 ${user.school_account} 密码已失效，请重新登录更新`);
        } else {
          // 凭证有效，确保标记为有效
          await db.run(`
            UPDATE users 
            SET credential_valid = 1, 
                credential_error = NULL,
                updated_at = datetime('now')
            WHERE id = ?
          `, [user.id]);
        }
        
        // 延迟一下，避免请求过快
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        logger.error(`检查用户 ${user.id} 凭证失败:`, error);
      }
    }
    
    logger.info('用户凭证检查完成');
  } catch (error) {
    logger.error('检查用户凭证任务失败:', error);
  }
}

// 检查单个用户凭证
async function checkUserCredential(userId) {
  try {
    const user = await db.get(`
      SELECT id, school_account, school_password, credential_valid, credential_error
      FROM users WHERE id = ?
    `, [userId]);
    
    if (!user) {
      return { valid: false, error: '用户不存在' };
    }
    
    // 如果已经标记为失效，直接返回
    if (user.credential_valid === 0) {
      return { 
        valid: false, 
        error: user.credential_error || '账号或密码已过期，请重新登录' 
      };
    }
    
    // 实时验证
    const verifyResult = await electricityService.verifySchoolCredentials(
      user.school_account,
      user.school_password
    );
    
    if (!verifyResult.success) {
      // 更新数据库标记
      await db.run(`
        UPDATE users 
        SET credential_valid = 0, credential_error = ?
        WHERE id = ?
      `, [verifyResult.message, userId]);
      
      return { valid: false, error: verifyResult.message };
    }
    
    return { valid: true };
    
  } catch (error) {
    logger.error(`检查用户 ${userId} 凭证失败:`, error);
    return { valid: false, error: '验证失败' };
  }
}

module.exports = {
  checkAllUsersCredentials,
  checkUserCredential
};