const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

/**
 * 获取最新版本信息
 * GET /api/update/check?versionCode=1
 */
router.get('/check', (req, res) => {
  try {
    const { versionCode } = req.query;
    const currentVersion = parseInt(versionCode) || 0;
    
    // 读取更新配置 - 使用绝对路径
    const updateConfigPath = path.resolve(process.cwd(), 'public', 'update.json');
    console.log('Update config path:', updateConfigPath);
    
    if (!fs.existsSync(updateConfigPath)) {
      console.error('update.json not found:', updateConfigPath);
      return res.status(500).json({
        success: false,
        error: '更新配置不存在'
      });
    }
    
    const updateConfig = JSON.parse(fs.readFileSync(updateConfigPath, 'utf8'));
    
    // 检查是否需要更新
    const hasUpdate = updateConfig.versionCode > currentVersion;
    
    res.json({
      success: true,
      hasUpdate,
      data: hasUpdate ? updateConfig : null
    });
  } catch (error) {
    console.error('检查更新失败:', error);
    res.status(500).json({
      success: false,
      error: '检查更新失败: ' + error.message
    });
  }
});

module.exports = router;