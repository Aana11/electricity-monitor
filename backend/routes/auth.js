const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { generateToken } = require('../middleware/auth');
const electricityService = require('../services/electricityService');
const logger = require('../utils/logger');

// 用户注册/登录
router.post('/login', async (req, res) => {
  try {
    const { account, password, role } = req.body;
    
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
    let finalRole;
    
    if (existingUser) {
      // 已有用户，检查身份变更
      const requestedRole = role === 'leader' ? 'leader' : 'member';
      
      if (existingUser.role === 'leader' && requestedRole === 'member') {
        // 原来是宿舍长，APP选了成员 - 自动以宿舍长身份登录
        finalRole = 'leader';
      } else if (existingUser.role === 'member' && requestedRole === 'leader') {
        // 原来是成员，想升级成宿舍长 - 检查是否已有宿舍长
        const existingLeader = await db.get(
          "SELECT * FROM users WHERE room_name = ? AND role = 'leader' AND is_active = 1 AND id != ?",
          [deviceInfo?.RoomName, existingUser.id]
        );
        if (existingLeader) {
          return res.status(400).json({ 
            error: '该宿舍已有宿舍长，无法升级身份' 
          });
        }
        finalRole = 'leader';
      } else {
        // 保持原有身份
        finalRole = existingUser.role;
      }
      
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
         role = ?,
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
          finalRole,
          existingUser.id
        ]
      );
      userId = existingUser.id;
    } else {
      // 新用户
      finalRole = role === 'leader' ? 'leader' : 'member';
      
      // 如果是宿舍长，检查该宿舍是否已有宿舍长
      if (finalRole === 'leader' && deviceInfo?.RoomName) {
        const existingLeader = await db.get(
          "SELECT * FROM users WHERE room_name = ? AND role = 'leader' AND is_active = 1",
          [deviceInfo.RoomName]
        );
        if (existingLeader) {
          return res.status(400).json({ 
            error: '该宿舍已有宿舍长注册，请选择"宿舍成员"身份或联系现任宿舍长' 
          });
        }
      }
      
      // 创建新用户
      const result = await db.run(
        `INSERT INTO users 
         (school_account, school_password, real_name, gender, mobile, room_id, room_name, device_no, role, last_login_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          account,
          password,
          userInfo.RealName,
          userInfo.Gender,
          userInfo.Mobile,
          deviceInfo?.RoomId,
          deviceInfo?.RoomName,
          deviceInfo?.DevicesList?.[0]?.DevcieNo,
          finalRole
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
        deviceNo: fullUser.device_no,
        role: fullUser.role
      }
    });
    
  } catch (error) {
    logger.error('登录失败:', error);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

module.exports = router;
