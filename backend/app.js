const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const db = require('./config/database');
const logger = require('./utils/logger');
const electricityService = require('./services/electricityService');
const alertService = require('./services/alertService');
const recurringAffairService = require('./services/recurringAffairService');

const app = express();
const PORT = process.env.PORT || 3000;

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());

// 限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// 解析JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/electricity', require('./routes/electricity'));
app.use('/api/rankings', require('./routes/rankings'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/affairs', require('./routes/affairs'));
app.use('/api/affairs', require('./routes/recurringAffairs'));
app.use('/api/votes', require('./routes/votes'));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// 所有其他路由返回index.html（SPA支持）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 定时任务：每2小时采集一次数据
cron.schedule('0 */2 * * *', async () => {
  logger.info('🕐 开始定时数据采集任务');
  try {
    await electricityService.collectAllUsersData();
    logger.info('✅ 定时数据采集完成');
  } catch (error) {
    logger.error('❌ 定时数据采集失败:', error.message);
  }
});

// 定时任务：每天凌晨计算前一天的用电统计
cron.schedule('5 0 * * *', async () => {
  logger.info('🕐 开始计算昨日用电统计');
  try {
    await electricityService.calculateDailyUsage();
    logger.info('✅ 昨日用电统计计算完成');
  } catch (error) {
    logger.error('❌ 用电统计计算失败:', error.message);
  }
});

// 定时任务：每4小时检查一次余额预警
cron.schedule('0 */4 * * *', async () => {
  logger.info('🕐 开始检查余额预警');
  try {
    await alertService.checkAndSendAlerts();
    logger.info('✅ 余额预警检查完成');
  } catch (error) {
    logger.error('❌ 余额预警检查失败:', error.message);
  }
});

// 定时任务：每天早上8点生成当天的周期事务
cron.schedule('0 8 * * *', async () => {
  logger.info('🕐 开始生成周期事务');
  try {
    const count = await recurringAffairService.generateTodayAffairs();
    logger.info(`✅ 周期事务生成完成: ${count} 个`);
  } catch (error) {
    logger.error('❌ 周期事务生成失败:', error.message);
  }
});

// 错误处理
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`🚀 服务器运行在端口 ${PORT}`);
});

module.exports = app;
