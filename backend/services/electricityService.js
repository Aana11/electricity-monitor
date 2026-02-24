const axios = require('axios');
const db = require('../config/database');
const logger = require('../utils/logger');

// 创建axios实例
function createInstance() {
  return axios.create({
    baseURL: 'https://wpp.nnnu.edu.cn',
    timeout: 30000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': 'https://wpp.nnnu.edu.cn',
      'Referer': 'https://wpp.nnnu.edu.cn/Login/Login'
    },
    maxRedirects: 5
  });
}

// 验证学校账号密码
async function verifySchoolCredentials(account, password) {
  const instance = createInstance();
  let cookies = '';
  
  instance.interceptors.request.use(config => {
    if (cookies) config.headers['Cookie'] = cookies;
    return config;
  });
  
  instance.interceptors.response.use(response => {
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
      cookies = setCookie.map(c => c.split(';')[0]).join('; ');
    }
    return response;
  });
  
  try {
    await instance.get('/Login/Login');
    
    const loginData = new URLSearchParams();
    loginData.append('account', account);
    loginData.append('password', password);
    
    const loginRes = await instance.post('/Login/LoginJson', loginData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
    });
    
    if (loginRes.data.Tag !== 1) {
      return { success: false, message: loginRes.data.Message || '账号或密码错误' };
    }
    
    const userRes = await instance.post('/Home/GetUserInfo', {}, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    const deviceRes = await instance.post('/Home/GetUserBindDevices', {}, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    return {
      success: true,
      userInfo: userRes.data.Data,
      deviceInfo: deviceRes.data.Data
    };
    
  } catch (error) {
    logger.error('验证学校账号失败:', error.message);
    return { success: false, message: '连接学校系统失败' };
  }
}

// 采集单个用户数据
async function collectUserData(user) {
  const instance = createInstance();
  let cookies = '';
  
  instance.interceptors.request.use(config => {
    if (cookies) config.headers['Cookie'] = cookies;
    return config;
  });
  
  instance.interceptors.response.use(response => {
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
      cookies = setCookie.map(c => c.split(';')[0]).join('; ');
    }
    return response;
  });
  
  try {
    await instance.get('/Login/Login');
    
    const loginData = new URLSearchParams();
    loginData.append('account', user.school_account);
    loginData.append('password', user.school_password);
    
    const loginRes = await instance.post('/Login/LoginJson', loginData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
    });
    
    if (loginRes.data.Tag !== 1) {
      throw new Error('登录失败: ' + loginRes.data.Message);
    }
    
    const deviceRes = await instance.post('/Home/GetUserBindDevices', {}, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    if (deviceRes.data.Tag !== 1 || !deviceRes.data.Data) {
      throw new Error('未绑定设备');
    }
    
    const roomData = deviceRes.data.Data;
    const devices = roomData.DevicesList || [];
    
    const records = [];
    
    for (const device of devices) {
      if (device.DeviceType === 1) {
        const remainingKwh = device.DevicePrice > 0 
          ? parseFloat((device.DeviceBalance / device.DevicePrice).toFixed(2))
          : 0;
        
        await db.run(
          `INSERT INTO electricity_records 
           (user_id, device_no, balance, price, remaining_kwh, meter_reading_time, collected_at)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
          [
            user.id,
            device.DevcieNo,
            device.DeviceBalance,
            device.DevicePrice,
            remainingKwh,
            device.UpdateTime
          ]
        );
        
        records.push({
          deviceNo: device.DevcieNo,
          balance: device.DeviceBalance,
          price: device.DevicePrice,
          remainingKwh,
          roomName: roomData.RoomName
        });
      }
    }
    
    await db.run(
      `UPDATE users SET room_name = ?, device_no = ?, updated_at = datetime('now') WHERE id = ?`,
      [roomData.RoomName, devices[0]?.DevcieNo || null, user.id]
    );
    
    return { success: true, records };
    
  } catch (error) {
    logger.error(`采集用户 ${user.id} 数据失败:`, error.message);
    return { success: false, error: error.message };
  }
}

// 采集所有用户数据
async function collectAllUsersData() {
  const users = await db.all('SELECT * FROM users WHERE is_active = 1');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const user of users) {
    const result = await collectUserData(user);
    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  await db.run(
    `INSERT INTO collection_logs (task_name, status, total_users, success_count, fail_count, started_at, completed_at)
     VALUES ('定时采集', ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [failCount === 0 ? 1 : (successCount > 0 ? 3 : 2), users.length, successCount, failCount]
  );
  
  logger.info(`采集完成: 成功 ${successCount}, 失败 ${failCount}`);
  return { successCount, failCount };
}

// 获取用户当前数据
async function getUserCurrentData(userId) {
  const record = await db.get(
    `SELECT * FROM electricity_records 
     WHERE user_id = ? 
     ORDER BY collected_at DESC LIMIT 1`,
    [userId]
  );
  
  if (!record) return null;
  
  const prevRecord = await db.get(
    `SELECT * FROM electricity_records 
     WHERE user_id = ? AND collected_at <= datetime('now', '-24 hours')
     ORDER BY collected_at DESC LIMIT 1`,
    [userId]
  );
  
  let dailyUsage = 0;
  let predictedDays = 0;
  
  if (prevRecord) {
    const hoursDiff = (new Date(record.collected_at) - new Date(prevRecord.collected_at)) / (1000 * 60 * 60);
    const balanceDiff = prevRecord.balance - record.balance;
    if (hoursDiff > 0) {
      dailyUsage = parseFloat((balanceDiff / hoursDiff * 24).toFixed(2));
    }
  }
  
  if (dailyUsage > 0) {
    predictedDays = Math.floor(record.balance / dailyUsage);
  }
  
  return {
    balance: record.balance,
    remainingKwh: record.remaining_kwh,
    price: record.price,
    meterReadingTime: record.meter_reading_time,
    collectedAt: record.collected_at,
    dailyUsage,
    predictedDays,
    predictedEmptyDate: predictedDays > 0 
      ? new Date(Date.now() + predictedDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : null
  };
}

// 获取用户历史数据
async function getUserHistory(userId, days = 7) {
  const records = await db.all(
    `SELECT * FROM electricity_records 
     WHERE user_id = ? 
     AND collected_at >= datetime('now', '-${days} days')
     ORDER BY collected_at ASC`,
    [userId]
  );
  
  return records;
}

// 格式化房间名称
function formatRoomName(roomName) {
  if (!roomName) return '';
  
  // 示例输入: "武鸣校区桂园公寓13栋5楼学生宿舍桂园公寓13-513"
  // 目标输出: "武鸣桂园13-513"
  
  // 步骤1: 提取校区 (武鸣/五合/明秀)
  let campus = '';
  if (roomName.includes('武鸣')) campus = '武鸣';
  else if (roomName.includes('五合')) campus = '五合';
  else if (roomName.includes('明秀')) campus = '明秀';
  
  // 步骤2: 提取园区 (桂园/兰园/松园/竹园/梅园/榕园/桃园)
  const gardens = ['桂园', '兰园', '松园', '竹园', '梅园', '榕园', '桃园'];
  let garden = '';
  for (const g of gardens) {
    if (roomName.includes(g)) {
      garden = g;
      break;
    }
  }
  
  // 步骤3: 提取楼栋和房间号
  // 先找 "数字-数字" 格式 (如 13-513)
  const roomMatch = roomName.match(/(\d+)-(\d+)/);
  if (roomMatch) {
    return campus + garden + roomMatch[1] + '-' + roomMatch[2];
  }
  
  // 如果没找到 "13-513" 格式，尝试找 "13栋" 和后面的房间号
  const buildingMatch = roomName.match(/(\d+)栋/);
  if (buildingMatch) {
    const building = buildingMatch[1];
    // 找楼栋后面的数字（房间号）
    const afterBuilding = roomName.substring(roomName.indexOf(buildingMatch[0]) + buildingMatch[0].length);
    const roomNumMatch = afterBuilding.match(/(\d{3})/);
    if (roomNumMatch) {
      return campus + garden + building + '-' + roomNumMatch[1];
    }
    return campus + garden + building;
  }
  
  // 如果都无法匹配，返回简化后的原名
  return roomName.replace(/校区|公寓|学生宿舍/g, '');
}

// 获取排行榜
async function getRankings(type = 'balance') {
  let results;
  
  if (type === 'balance') {
    // 按宿舍分组，取每个宿舍的最新数据
    results = await db.all(`
      SELECT 
        MIN(u.id) as id,
        GROUP_CONCAT(DISTINCT u.real_name) as real_name,
        u.room_name,
        r.balance,
        r.remaining_kwh,
        MAX(r.collected_at) as collected_at
      FROM users u
      LEFT JOIN (
        SELECT user_id, balance, remaining_kwh, collected_at
        FROM electricity_records
        WHERE id IN (
          SELECT MAX(id) FROM electricity_records GROUP BY user_id
        )
      ) r ON u.id = r.user_id
      WHERE u.is_active = 1 AND u.room_name IS NOT NULL
      GROUP BY u.room_name
      ORDER BY r.balance ASC
    `);
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    // 按宿舍分组统计用电量
    results = await db.all(`
      SELECT 
        MIN(u.id) as id,
        GROUP_CONCAT(DISTINCT u.real_name) as real_name,
        u.room_name,
        SUM(d.used_kwh) as used_kwh,
        SUM(d.used_amount) as used_amount
      FROM users u
      LEFT JOIN daily_usage d ON u.id = d.user_id AND d.date = ?
      WHERE u.is_active = 1 AND u.room_name IS NOT NULL
      GROUP BY u.room_name
      ORDER BY used_kwh DESC
    `, [dateStr]);
  }
  
  // 格式化房间名称
  return results.map(item => ({
    ...item,
    room_name: formatRoomName(item.room_name)
  }));
}

// 计算每日用电统计
async function calculateDailyUsage() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];
  
  const users = await db.all('SELECT id, device_no FROM users WHERE is_active = 1');
  
  for (const user of users) {
    if (!user.device_no) continue;
    
    const record = await db.get(
      `SELECT 
        MIN(balance) as min_balance,
        MAX(balance) as max_balance,
        COUNT(*) as record_count
       FROM electricity_records 
       WHERE user_id = ? AND device_no = ? 
       AND date(collected_at) = ?`,
      [user.id, user.device_no, dateStr]
    );
    
    if (!record || record.record_count === 0) continue;
    
    const usedAmount = parseFloat((record.max_balance - record.min_balance).toFixed(2));
    
    const priceRecord = await db.get(
      `SELECT price FROM electricity_records 
       WHERE user_id = ? AND device_no = ? AND date(collected_at) = ?
       ORDER BY collected_at DESC LIMIT 1`,
      [user.id, user.device_no, dateStr]
    );
    
    const price = priceRecord?.price || 0.5441;
    const usedKwh = price > 0 ? parseFloat((usedAmount / price).toFixed(2)) : 0;
    
    await db.run(
      `INSERT INTO daily_usage (user_id, device_no, date, start_balance, end_balance, used_kwh, used_amount, record_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, device_no, date) DO UPDATE SET
       start_balance = excluded.start_balance,
       end_balance = excluded.end_balance,
       used_kwh = excluded.used_kwh,
       used_amount = excluded.used_amount,
       record_count = excluded.record_count`,
      [user.id, user.device_no, dateStr, record.max_balance, record.min_balance, usedKwh, usedAmount, record.record_count]
    );
  }
  
  logger.info(`每日用电统计计算完成: ${dateStr}`);
}

// 生成排行榜
async function generateRankings() {
  logger.info('排行榜生成完成');
}

module.exports = {
  verifySchoolCredentials,
  collectUserData,
  collectAllUsersData,
  calculateDailyUsage,
  generateRankings,
  getUserCurrentData,
  getUserHistory,
  getRankings
};
