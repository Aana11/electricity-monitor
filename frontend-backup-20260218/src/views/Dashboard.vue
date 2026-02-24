<template>
  <div class="dashboard">
    <!-- 顶部导航 -->
    <nav class="navbar">
      <div class="nav-brand">
        <Lightning class="brand-icon" />
        <span class="brand-text">NNNU电费监控</span>
      </div>
      
      <div class="nav-menu">
        <router-link to="/dashboard" class="nav-item" :class="{ active: $route.path === '/dashboard' }">
          <DataLine class="nav-icon" />
          <span class="nav-text">概览</span>
        </router-link>
        <router-link to="/analysis" class="nav-item" :class="{ active: $route.path === '/analysis' }">
          <TrendCharts class="nav-icon" />
          <span class="nav-text">分析</span>
        </router-link>
        <router-link to="/rankings" class="nav-item" :class="{ active: $route.path === '/rankings' }">
          <Trophy class="nav-icon" />
          <span class="nav-text">排行榜</span>
        </router-link>
      </div>
      
      <div class="nav-user">
        <el-dropdown @command="handleCommand" trigger="click">
          <span class="user-info">
            <UserFilled class="user-avatar" />
            <span class="user-name">{{ userStore.user?.realName || '用户' }}</span>
            <ArrowDown class="user-arrow" />
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">
                <SwitchButton class="dropdown-icon" /> 退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </nav>
    
    <!-- 主要内容 -->
    <main class="main-content">
      <!-- 欢迎语 -->
      <div class="welcome-section animate-fade-in">
        <h2>{{ greeting }}，{{ userStore.user?.realName || '同学' }}！👋</h2>
        <p class="room-info">🏠 {{ userStore.user?.roomName || '未绑定宿舍' }}</p>
      </div>
      
      <!-- 数据卡片 -->
      <div class="stats-grid">
        <!-- 余额卡片 -->
        <div class="stat-card balance-card animate-fade-in" :style="{ animationDelay: '0.1s' }">
          <div class="card-header">
            <div class="card-icon-wrapper balance">
              <Wallet class="card-icon" />
            </div>
            <span>当前余额</span>
          </div>
          
          <div class="card-body">
            <div class="amount" :class="{ warning: currentData.balance < 20 }">
              <span class="currency">¥</span>
              <span class="number">{{ formatNumber(currentData.balance) }}</span>
            </div>
            
            <div class="trend" v-if="currentData.dailyUsage">
              <span :class="currentData.dailyUsage > 0 ? 'down' : 'up'">
                {{ currentData.dailyUsage > 0 ? '↓' : '↑' }} 
                日均 {{ Math.abs(currentData.dailyUsage).toFixed(2) }}元
              </span>
            </div>
          </div>
          
          <el-button 
            class="refresh-btn" 
            :icon="Refresh" 
            :loading="refreshing"
            @click="refreshData"
            circle
            size="small"
          />
        </div>
        
        <!-- 剩余电量卡片 -->
        <div class="stat-card kwh-card animate-fade-in" :style="{ animationDelay: '0.2s' }">
          <div class="card-header">
            <div class="card-icon-wrapper kwh">
              <Lightning class="card-icon" />
            </div>
            <span>剩余电量</span>
          </div>
          
          <div class="card-body">
            <div class="amount">
              <span class="number">{{ formatNumber(currentData.remainingKwh) }}</span>
              <span class="unit">kWh</span>
            </div>
            
            <div class="price">电价: ¥{{ currentData.price }}/度</div>
          </div>
        </div>
        
        <!-- 预计可用天数 -->
        <div class="stat-card days-card animate-fade-in" :style="{ animationDelay: '0.3s' }">
          <div class="card-header">
            <div class="card-icon-wrapper days" :class="{ danger: currentData.predictedDays < 7 }">
              <Calendar class="card-icon" />
            </div>
            <span>预计可用</span>
          </div>
          
          <div class="card-body">
            <div class="amount" :class="{ danger: currentData.predictedDays < 7 }">
              <span class="number">{{ currentData.predictedDays || '--' }}</span>
              <span class="unit">天</span>
            </div>
            
            <div class="predict-date" v-if="currentData.predictedEmptyDate">
              预计 {{ currentData.predictedEmptyDate }} 耗尽
            </div>
          </div>
        </div>
        
        <!-- 设备信息 -->
        <div class="stat-card device-card animate-fade-in" :style="{ animationDelay: '0.4s' }">
          <div class="card-header">
            <div class="card-icon-wrapper device">
              <Cpu class="card-icon" />
            </div>
            <span>电表信息</span>
          </div>
          
          <div class="card-body">
            <div class="device-no">{{ userStore.user?.deviceNo || '--' }}</div>
            
            <div class="update-time" v-if="currentData.collectedAt">
              更新: {{ formatTime(currentData.collectedAt) }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- 图表区域 -->
      <div class="charts-section">
        <div class="chart-card animate-fade-in" :style="{ animationDelay: '0.5s' }">
          <div class="chart-header">
            <h3>📈 近7天用电趋势</h3>
            <el-radio-group v-model="chartDays" size="small" @change="loadHistory">
              <el-radio-button :label="7">7天</el-radio-button>
              <el-radio-button :label="30">30天</el-radio-button>
            </el-radio-group>
          </div>
          
          <v-chart class="chart" :option="balanceChartOption" autoresize />
        </div>
      </div>
    </main>
    
    <!-- 手机端底部导航 -->
    <nav class="mobile-nav">
      <router-link to="/dashboard" class="mobile-nav-item" :class="{ active: $route.path === '/dashboard' }">
        <DataLine class="mobile-nav-icon" />
        <span>概览</span>
      </router-link>
      <router-link to="/analysis" class="mobile-nav-item" :class="{ active: $route.path === '/analysis' }">
        <TrendCharts class="mobile-nav-icon" />
        <span>分析</span>
      </router-link>
      <router-link to="/rankings" class="mobile-nav-item" :class="{ active: $route.path === '/rankings' }">
        <Trophy class="mobile-nav-icon" />
        <span>排行榜</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import {
  Lightning, DataLine, TrendCharts, Trophy, UserFilled, ArrowDown,
  Wallet, Refresh, Calendar, Cpu, SwitchButton
} from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user.js'
import { electricityApi } from '../api/index.js'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent])

const router = useRouter()
const userStore = useUserStore()
const refreshing = ref(false)
const chartDays = ref(7)

const currentData = ref({
  balance: 0,
  remainingKwh: 0,
  price: 0.5441,
  dailyUsage: 0,
  predictedDays: 0,
  predictedEmptyDate: null,
  collectedAt: null
})

const historyData = ref([])

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 11) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const balanceChartOption = computed(() => {
  const dates = historyData.value.map(d => {
    const date = new Date(d.collected_at)
    return `${date.getMonth() + 1}/${date.getDate()}`
  })
  const balances = historyData.value.map(d => d.balance)

  return {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>余额: ¥{c}'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLine: { lineStyle: { color: '#cbd5e0' } },
      axisLabel: { color: '#718096', fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { 
        color: '#718096',
        fontSize: 12,
        formatter: '¥{value}'
      }
    },
    series: [{
      name: '余额',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      data: balances,
      lineStyle: {
        color: '#667eea',
        width: 3
      },
      itemStyle: {
        color: '#667eea',
        borderWidth: 2,
        borderColor: '#fff'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
            { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
          ]
        }
      }
    }]
  }
})

const loadData = async () => {
  try {
    const res = await electricityApi.getCurrent()
    if (res.data.success) {
      currentData.value = res.data.data
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

const loadHistory = async () => {
  try {
    const res = await electricityApi.getHistory(chartDays.value)
    if (res.data.success) {
      historyData.value = res.data.data
    }
  } catch (error) {
    console.error('加载历史数据失败:', error)
  }
}

const refreshData = async () => {
  refreshing.value = true
  try {
    const res = await electricityApi.refresh()
    if (res.data.success) {
      currentData.value = res.data.data
      ElMessage.success('数据已刷新')
      await loadHistory()
    }
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

const formatNumber = (num) => {
  if (num === undefined || num === null) return '--'
  return num.toFixed(2)
}

const formatTime = (time) => {
  if (!time) return '--'
  const date = new Date(time)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const handleCommand = (cmd) => {
  if (cmd === 'logout') {
    userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  }
}

onMounted(() => {
  loadData()
  loadHistory()
})
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  padding-bottom: 70px;
}

/* ===== 导航栏 ===== */
.navbar {
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

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.brand-icon {
  width: 28px;
  height: 28px;
  color: #667eea;
  flex-shrink: 0;
}

.brand-text {
  font-size: 18px;
  font-weight: 700;
  color: #1a202c;
  white-space: nowrap;
}

/* 中间菜单 */
.nav-menu {
  display: flex;
  align-items: center;
  gap: 8px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  color: #4a5568;
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.nav-item:hover {
  background: #f7fafc;
  color: #667eea;
}

.nav-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.nav-icon {
  width: 18px;
  height: 18px;
}

/* 右侧用户 */
.nav-user {
  cursor: pointer;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4a5568;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.user-info:hover {
  background: #f7fafc;
}

.user-avatar {
  width: 32px;
  height: 32px;
  color: #667eea;
}

.user-name {
  font-size: 14px;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-arrow {
  width: 16px;
  height: 16px;
}

.dropdown-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}

/* ===== 主要内容 ===== */
.main-content {
  padding: 80px 24px 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.welcome-section {
  margin-bottom: 24px;
}

.welcome-section h2 {
  font-size: 24px;
  color: white;
  margin-bottom: 6px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.room-info {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

/* ===== 数据卡片网格 ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 20px;
  position: relative;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.card-header span {
  color: #718096;
  font-size: 13px;
  font-weight: 500;
}

.card-icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon-wrapper.balance {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card-icon-wrapper.kwh {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.card-icon-wrapper.days {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.card-icon-wrapper.days.danger {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
}

.card-icon-wrapper.device {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.card-icon {
  width: 20px;
  height: 20px;
  color: white;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.amount {
  font-size: 28px;
  font-weight: 800;
  color: #1a202c;
  display: flex;
  align-items: baseline;
  gap: 4px;
  line-height: 1.2;
}

.amount .currency {
  font-size: 18px;
  font-weight: 600;
}

.amount .number {
  font-size: 32px;
}

.amount .unit {
  font-size: 14px;
  font-weight: 500;
  color: #718096;
}

.amount.warning {
  color: #f56565;
}

.amount.danger {
  color: #e53e3e;
}

.trend {
  font-size: 12px;
  margin-top: 4px;
}

.trend .up {
  color: #48bb78;
}

.trend .down {
  color: #f56565;
}

.price, .update-time, .predict-date {
  font-size: 12px;
  color: #718096;
}

.device-no {
  font-family: 'SF Mono', monospace;
  font-size: 14px;
  color: #4a5568;
  background: #f7fafc;
  padding: 8px 10px;
  border-radius: 6px;
  word-break: break-all;
}

.refresh-btn {
  position: absolute;
  top: 16px;
  right: 16px;
}

/* ===== 图表区域 ===== */
.charts-section {
  display: grid;
  gap: 20px;
}

.chart-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 20px;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.chart-header h3 {
  font-size: 16px;
  color: #1a202c;
  font-weight: 600;
}

.chart {
  height: 280px;
}

/* ===== 手机端底部导航 ===== */
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

/* ===== 响应式设计 ===== */

/* 平板 */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 手机 */
@media (max-width: 640px) {
  .navbar {
    padding: 0 16px;
    height: 56px;
  }
  
  .brand-text {
    font-size: 16px;
  }
  
  /* 隐藏电脑端菜单 */
  .nav-menu {
    display: none;
  }
  
  .user-name {
    display: none;
  }
  
  .main-content {
    padding: 72px 16px 80px;
  }
  
  .welcome-section h2 {
    font-size: 20px;
  }
  
  /* 卡片单列显示 */
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .stat-card {
    padding: 16px;
  }
  
  .amount .number {
    font-size: 28px;
  }
  
  /* 图表高度调整 */
  .chart {
    height: 220px;
  }
  
  /* 显示底部导航 */
  .mobile-nav {
    display: flex;
  }
}

/* 小屏手机 */
@media (max-width: 380px) {
  .brand-text {
    font-size: 14px;
  }
  
  .welcome-section h2 {
    font-size: 18px;
  }
  
  .amount .number {
    font-size: 24px;
  }
}
</style>
