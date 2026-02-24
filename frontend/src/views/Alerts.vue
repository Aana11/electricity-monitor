<template>
  <div class="alerts-page">
    <nav class="simple-nav">
      <router-link to="/electricity" class="back-link">
        <ArrowLeft class="back-icon" />
        <span>返回</span>
      </router-link>
      <h1>🔔 余额预警</h1>
      <div class="nav-placeholder"></div>
    </nav>

    <main class="alerts-content">
      <!-- 预警开关 -->
      <div class="settings-card">
        <div class="settings-header">
          <div class="icon-wrapper">
            <Bell class="settings-icon" />
          </div>
          <div class="settings-title">
            <h3>余额预警</h3>
            <p>当余额低于设定值时提醒您</p>
          </div>
          <el-switch
            v-model="settings.enabled"
            @change="saveSettings"
            active-text="开启"
            inactive-text="关闭"
          />
        </div>
      </div>

      <!-- 预警阈值设置 -->
      <div class="settings-card" v-if="settings.enabled">
        <div class="card-title">
          <span class="title-icon">💰</span>
          <span>预警阈值</span>
        </div>
        
        <div class="threshold-list">
          <div class="threshold-item">
            <div class="threshold-info">
              <span class="threshold-name">20元预警</span>
              <span class="threshold-desc">余额低于20元时提醒</span>
            </div>
            <el-switch v-model="settings.threshold_20" @change="saveSettings" />
          </div>
          
          <div class="threshold-item">
            <div class="threshold-info">
              <span class="threshold-name">10元预警</span>
              <span class="threshold-desc">余额低于10元时提醒</span>
            </div>
            <el-switch v-model="settings.threshold_10" @change="saveSettings" />
          </div>
          
          <div class="threshold-item">
            <div class="threshold-info">
              <span class="threshold-name">5元预警</span>
              <span class="threshold-desc">余额低于5元时紧急提醒</span>
            </div>
            <el-switch v-model="settings.threshold_5" @change="saveSettings" />
          </div>
        </div>
      </div>

      <!-- 推送方式 -->
      <div class="settings-card" v-if="settings.enabled">
        <div class="card-title">
          <span class="title-icon">📱</span>
          <span>推送方式</span>
        </div>
        
        <div class="push-list">
          <div class="push-item">
            <div class="push-info">
              <span class="push-name">浏览器通知</span>
              <span class="push-desc">通过浏览器推送通知</span>
            </div>
            <el-switch v-model="settings.push_browser" @change="onBrowserPushChange" />
          </div>
          
          <div class="push-item">
            <div class="push-info">
              <span class="push-name">邮件通知</span>
              <span class="push-desc">通过邮件接收预警</span>
            </div>
            <el-switch v-model="settings.push_email" @change="saveSettings" />
          </div>
          
          <div class="email-input" v-if="settings.push_email">
            <el-input
              v-model="settings.email"
              placeholder="请输入邮箱地址"
              @blur="saveSettings"
            >
              <template #prefix>
                <Message class="input-icon" />
              </template>
            </el-input>
          </div>
        </div>
      </div>

      <!-- 预警历史 -->
      <div class="settings-card">
        <div class="card-title">
          <span class="title-icon">📋</span>
          <span>预警历史</span>
        </div>
        
        <div class="history-list" v-if="alertHistory.length > 0">
          <div 
            v-for="item in alertHistory" 
            :key="item.id"
            class="history-item"
          >
            <div class="history-icon" :class="getAlertLevel(item.threshold)">
              {{ getAlertIcon(item.threshold) }}
            </div>
            
            <div class="history-info">
              <div class="history-title">
                余额低于{{ item.threshold }}元
              </div>
              <div class="history-detail">
                余额: ¥{{ item.balance.toFixed(2) }} · {{ formatTime(item.sent_at) }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="empty-history" v-else>
          <span class="empty-icon">🔕</span>
          <p>暂无预警记录</p>
          <span class="empty-desc">当余额低于设定值时会在这里显示</span>
        </div>
      </div>
    </main>

    <!-- 手机端底部导航 -->
    <nav class="mobile-nav">
      <router-link to="/dashboard" class="mobile-nav-item">
        <DataLine class="mobile-nav-icon" />
        <span>概览</span>
      </router-link>
      <router-link to="/analysis" class="mobile-nav-item">
        <TrendCharts class="mobile-nav-icon" />
        <span>分析</span>
      </router-link>
      <router-link to="/rankings" class="mobile-nav-item">
        <Trophy class="mobile-nav-icon" />
        <span>排行榜</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ArrowLeft, Bell, DataLine, TrendCharts, Trophy, Message } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import api from '../api/index.js'

const settings = ref({
  enabled: true,
  threshold_20: true,
  threshold_10: true,
  threshold_5: true,
  push_browser: true,
  push_email: false,
  email: ''
})

const alertHistory = ref([])

// 获取设置
const loadSettings = async () => {
  try {
    const res = await api.get('/alerts/settings')
    if (res.data.success) {
      settings.value = { ...settings.value, ...res.data.data }
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

// 保存设置
const saveSettings = async () => {
  try {
    await api.post('/alerts/settings', settings.value)
    ElMessage.success('设置已保存')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

// 浏览器推送权限请求
const onBrowserPushChange = async (val) => {
  if (val && 'Notification' in window) {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      settings.value.push_browser = false
      ElMessage.warning('请允许浏览器通知权限')
    }
  }
  saveSettings()
}

// 获取预警历史
const loadHistory = async () => {
  try {
    const res = await api.get('/alerts/history')
    if (res.data.success) {
      alertHistory.value = res.data.data
    }
  } catch (error) {
    console.error('加载历史失败:', error)
  }
}

// 获取预警等级
const getAlertLevel = (threshold) => {
  if (threshold <= 5) return 'danger'
  if (threshold <= 10) return 'warning'
  return 'info'
}

// 获取预警图标
const getAlertIcon = (threshold) => {
  if (threshold <= 5) return '🔴'
  if (threshold <= 10) return '🟡'
  return '🔵'
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
  loadSettings()
  loadHistory()
})
</script>

<style scoped>
.alerts-page {
  min-height: 100vh;
  padding-bottom: 70px;
}

/* 导航 */
.simple-nav {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
}

.back-link {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
}

.back-icon {
  width: 20px;
  height: 20px;
}

.simple-nav h1 {
  font-size: 18px;
  color: #1a202c;
  font-weight: 600;
}

.nav-placeholder {
  width: 50px;
}

/* 内容区 */
.alerts-content {
  padding: 80px 24px 24px;
  max-width: 800px;
  margin: 0 auto;
}

/* 设置卡片 */
.settings-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.settings-icon {
  width: 24px;
  height: 24px;
  color: white;
}

.settings-title {
  flex: 1;
}

.settings-title h3 {
  font-size: 16px;
  color: #1a202c;
  margin-bottom: 4px;
}

.settings-title p {
  font-size: 13px;
  color: #718096;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.title-icon {
  font-size: 20px;
}

/* 阈值列表 */
.threshold-list,
.push-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.threshold-item,
.push-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
}

.threshold-info,
.push-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.threshold-name,
.push-name {
  font-size: 15px;
  font-weight: 500;
  color: #1a202c;
}

.threshold-desc,
.push-desc {
  font-size: 13px;
  color: #718096;
}

.email-input {
  margin-top: 12px;
  padding: 0 16px;
}

.input-icon {
  width: 16px;
  height: 16px;
  color: #718096;
}

/* 历史记录 */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #f8fafc;
  border-radius: 12px;
}

.history-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.history-icon.danger {
  background: #fee2e2;
}

.history-icon.warning {
  background: #fef3c7;
}

.history-icon.info {
  background: #dbeafe;
}

.history-info {
  flex: 1;
}

.history-title {
  font-size: 14px;
  font-weight: 500;
  color: #1a202c;
  margin-bottom: 2px;
}

.history-detail {
  font-size: 12px;
  color: #718096;
}

.empty-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  color: #718096;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-history p {
  font-size: 16px;
  margin-bottom: 4px;
}

.empty-desc {
  font-size: 13px;
  color: #a0aec0;
}

/* 手机端底部导航 */
.mobile-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
  z-index: 100;
}

.mobile-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px;
  color: #718096;
  text-decoration: none;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.mobile-nav-item.active {
  color: #667eea;
}

.mobile-nav-icon {
  width: 22px;
  height: 22px;
}

/* 响应式 */
@media (max-width: 640px) {
  .simple-nav {
    padding: 0 16px;
    height: 56px;
  }

  .simple-nav h1 {
    font-size: 16px;
  }

  .alerts-content {
    padding: 72px 16px 80px;
  }

  .settings-card {
    padding: 16px;
  }

  .settings-header {
    gap: 12px;
  }

  .icon-wrapper {
    width: 44px;
    height: 44px;
  }

  .threshold-item,
  .push-item {
    padding: 14px 12px;
  }

  .threshold-name,
  .push-name {
    font-size: 14px;
  }

  .threshold-desc,
  .push-desc {
    font-size: 12px;
  }

  .mobile-nav {
    display: flex;
  }
}
</style>
