const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { generateToken } = require('../middleware/auth');
const electricityService = require('../services/electricityService');
const logger = require('../utils/logger');

// 用户注册/登录
router.post('/login', async (req, res) => {
  try {
    const { account, password } = req.body;
    
    if (!account || !password) {
      return res.status(400).json({ error: '请提供账号和密码' });
    }
    
    // 验证学校账号
    const verifyResult = await electricityService.verifySchoolCredentials(account, password);
    
    if (!verifyResult.success) {
      return res.status(401).json({ error: verifyResult.message });
    }
    
    const { userInfo, deviceInfo } = verifyResult;
    
    // 检查用户是否已存在
    const existingUser = await db.get(
      'SELECT * FROM users WHERE school_account = ?',
      [account]
    );
    
    let userId;
    
    if (existingUser) {
      // 更新用户信息
      await db.run(
        `UPDATE users SET 
         school_password = ?, 
         real_name = ?, 
         gender = ?,
         mobile = ?,
         room_id = ?,
         room_name = ?,
         device_no = ?,
         last_login_at = datetime('now'),
         is_active = 1
         WHERE id = ?`,
        [
          password,
          userInfo.RealName,
          userInfo.Gender,
          userInfo.Mobile,
          deviceInfo?.RoomId,
          deviceInfo?.RoomName,
          deviceInfo?.DevicesList?.[0]?.DevcieNo,
          existingUser.id
        ]
      );
      userId = existingUser.id;
    } else {
      // 创建新用户
      const result = await db.run(
        `INSERT INTO users 
         (school_account, school_password, real_name, gender, mobile, room_id, room_name, device_no, last_login_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          account,
          password,
          userInfo.RealName,
          userInfo.Gender,
          userInfo.Mobile,
          deviceInfo?.RoomId,
          deviceInfo?.RoomName,
          deviceInfo?.DevicesList?.[0]?.DevcieNo
        ]
      );
      userId = result.lastID;
    }
    
    // 立即采集一次数据
    await electricityService.collectUserData({
      id: userId,
      school_account: account,
      school_password: password
    });
    
    // 获取完整用户信息
    const fullUser = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    
    // 生成JWT
    const token = generateToken(fullUser);
    
    res.json({
      success: true,
      token,
      user: {
        id: fullUser.id,
        account: fullUser.school_account,
        realName: fullUser.real_name,
        gender: fullUser.gender,
        mobile: fullUser.mobile,
        roomName: fullUser.room_name,
        deviceNo: fullUser.device_no
      }
    });
    
  } catch (error) {
    logger.error('登录失败:', error);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

module.exports = router;
