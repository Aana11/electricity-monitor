<template>
  <div class="dashboard">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="glass-ball ball-1"></div>
      <div class="glass-ball ball-2"></div>
      <div class="glass-ball ball-3"></div>
    </div>

    <!-- 顶部导航 -->
    <nav class="navbar glass">
      <div class="nav-brand">
        <router-link to="/" class="back-btn">
          <ArrowLeft class="back-icon" />
          <span class="back-text">首页</span>
        </router-link>
        <Lightning class="brand-icon" />
        <span class="brand-text">电费监控</span>
      </div>
      
      <div class="nav-menu">
        <router-link to="/electricity" class="nav-item active">
          <DataLine class="nav-icon" />
          <span class="nav-text">概览</span>
        </router-link>
        <router-link to="/electricity/rankings" class="nav-item">
          <Trophy class="nav-icon" />
          <span class="nav-text">排行榜</span>
        </router-link>
      </div>
      
      <div class="nav-placeholder"></div>
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

      <!-- 统计概览 -->
      <div class="analysis-stats animate-fade-in" :style="{ animationDelay: '0.5s' }">
        <div class="stat-box">
          <div class="stat-label">近7天平均日用电</div>
          <div class="stat-value">
            {{ analysisData.averageDailyKwh?.toFixed(2) || '--' }}
            <span class="unit">kWh</span>
          </div>
        </div>
        
        <div class="stat-box">
          <div class="stat-label">昨日用电</div>
          <div class="stat-value">
            {{ yesterdayUsage?.toFixed(2) || '--' }}
            <span class="unit">kWh</span>
          </div>
        </div>
        
        <div class="stat-box">
          <div class="stat-label">本月累计</div>
          <div class="stat-value">
            {{ monthlyTotal?.toFixed(1) || '--' }}
            <span class="unit">kWh</span>
          </div>
        </div>
      </div>
      
      <!-- 图表区域 -->
      <div class="charts-section">
        <!-- 余额趋势 -->
        <div class="chart-card animate-fade-in" :style="{ animationDelay: '0.6s' }">
          <div class="chart-header">
            <h3>📈 余额趋势</h3>
            <el-radio-group v-model="chartDays" size="small" @change="loadHistory">
              <el-radio-button :label="7">7天</el-radio-button>
              <el-radio-button :label="30">30天</el-radio-button>
            </el-radio-group>
          </div>
          
          <v-chart class="chart" :option="balanceChartOption" autoresize />
        </div>

        <!-- 每日用电 -->
        <div class="chart-card animate-fade-in" :style="{ animationDelay: '0.7s' }">
          <div class="chart-header">
            <h3>⚡ 每日用电</h3>
            <span class="chart-subtitle">近7天</span>
          </div>
          
          <v-chart class="chart" :option="dailyUsageOption" autoresize />
        </div>
      </div>

      <!-- 用电建议 -->
      <div class="tips-box animate-fade-in" :style="{ animationDelay: '0.8s' }" v-if="tips.length > 0">
        <div class="box-header">
          <div class="icon-wrapper">
            <span class="icon">💡</span>
          </div>
          <h3>智能建议</h3>
        </div>
        
        <div class="tip-list">
          <div class="tip-item" v-for="(tip, index) in tips" :key="index">
            <div class="tip-icon-wrapper">
              <span class="tip-emoji">{{ tip.icon }}</span>
            </div>
            <div class="tip-content">
              <div class="tip-title">{{ tip.title }}</div>
              <div class="tip-desc">{{ tip.desc }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 快捷入口 -->
      <div class="quick-actions animate-fade-in" :style="{ animationDelay: '0.9s' }">
        <router-link to="/electricity/alerts" class="action-card">
          <div class="action-icon-wrapper alerts">
            <Bell class="action-icon" />
          </div>
          <div class="action-info">
            <span class="action-title">余额预警</span>
            <span class="action-desc">设置余额提醒</span>
          </div>
          <ArrowRight class="action-arrow" />
        </router-link>
        
        <router-link to="/electricity/heatmap" class="action-card">
          <div class="action-icon-wrapper heatmap">
            <Calendar class="action-icon" />
          </div>
          <div class="action-info">
            <span class="action-title">用电日历</span>
            <span class="action-desc">查看每日用电</span>
          </div>
          <ArrowRight class="action-arrow" />
        </router-link>
      </div>
    </main>
    
    <!-- 手机端底部导航 -->
    <nav class="mobile-nav">
      <router-link to="/electricity" class="mobile-nav-item active">
        <DataLine class="mobile-nav-icon" />
        <span>概览</span>
      </router-link>
      <router-link to="/electricity/rankings" class="mobile-nav-item">
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
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import {
  Lightning, DataLine, Trophy, Wallet, Refresh, Calendar, Cpu, Bell, ArrowRight, ArrowLeft
} from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user.js'
import { electricityApi } from '../api/index.js'

use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent])

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
const analysisData = ref({
  dailyUsage: [],
  averageDailyKwh: 0,
  current: null
})

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

const dailyUsageOption = computed(() => {
  const data = analysisData.value.dailyUsage || []
  const dates = data.map(d => d.date?.slice(5) || '')
  const usages = data.map(d => d.used_kwh || 0)
  
  return {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>用电: {c} kWh'
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
      data: dates,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#718096', fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
      axisLabel: { color: '#718096', fontSize: 12 }
    },
    series: [{
      name: '用电量',
      type: 'bar',
      data: usages,
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' }
          ]
        },
        borderRadius: [6, 6, 0, 0]
      },
      barWidth: '50%'
    }]
  }
})

const yesterdayUsage = computed(() => {
  const data = analysisData.value.dailyUsage || []
  if (data.length === 0) return 0
  return data[data.length - 1]?.used_kwh || 0
})

const monthlyTotal = computed(() => {
  const data = analysisData.value.dailyUsage || []
  return data.reduce((sum, d) => sum + (d.used_kwh || 0), 0)
})

const tips = computed(() => {
  const data = analysisData.value
  const tips = []
  
  if (currentData.value.predictedDays < 7 && currentData.value.predictedDays > 0) {
    tips.push({
      icon: '⚠️',
      title: '余额不足警告',
      desc: `预计${currentData.value.predictedDays}天后电费耗尽，建议尽快充值！`
    })
  }
  
  if (data.averageDailyKwh > 15) {
    tips.push({
      icon: '🔥',
      title: '用电量偏高',
      desc: `日均用电${data.averageDailyKwh.toFixed(1)}度，建议检查高功耗电器使用情况。`
    })
  } else if (data.averageDailyKwh > 0 && data.averageDailyKwh < 5) {
    tips.push({
      icon: '✅',
      title: '用电量健康',
      desc: '您的用电量处于合理范围，继续保持！'
    })
  }
  
  tips.push({
    icon: '💡',
    title: '节电小贴士',
    desc: '空调设置在26℃最省电，人走关灯可以节省10-15%电费。'
  })
  
  return tips
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

const loadAnalysis = async () => {
  try {
    const res = await electricityApi.getAnalysis()
    if (res.data.success) {
      analysisData.value = res.data.data
    }
  } catch (error) {
    console.error('加载分析数据失败:', error)
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
      await loadAnalysis()
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

onMounted(() => {
  loadData()
  loadHistory()
  loadAnalysis()
})
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow-x: hidden;
  padding-bottom: 70px;
}

/* ===== 背景装饰 ===== */
.bg-decoration {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.glass-ball {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), rgba(255,255,255,0.05));
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.ball-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  right: -100px;
  animation: float 8s ease-in-out infinite;
}

.ball-2 {
  width: 300px;
  height: 300px;
  bottom: 10%;
  left: -50px;
  animation: float 10s ease-in-out infinite reverse;
}

.ball-3 {
  width: 200px;
  height: 200px;
  top: 40%;
  right: 10%;
  animation: float 6s ease-in-out infinite 1s;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}

/* ===== 磨砂玻璃基础样式 ===== */
.glass {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

/* ===== 导航栏 ===== */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 100;
  border-bottom: 1px solid rgba(255,255,255,0.2);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(102, 126, 234, 0.2);
}

.back-icon {
  width: 18px;
  height: 18px;
  color: #667eea;
}

.back-text {
  font-size: 14px;
  font-weight: 500;
  color: #667eea;
}

.brand-icon {
  width: 28px;
  height: 28px;
  color: white;
}

.brand-text {
  font-size: 20px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 10px rgba(0,0,0,0.2);
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
  padding: 10px 20px;
  border-radius: 12px;
  color: rgba(255,255,255,0.8);
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.nav-item:hover {
  background: rgba(255,255,255,0.2);
  color: white;
}

.nav-item.active {
  background: rgba(255,255,255,0.25);
  color: white;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.nav-icon {
  width: 18px;
  height: 18px;
}

/* 右侧占位 */
.nav-placeholder {
  width: 120px;
}

/* ===== 主要内容 ===== */
.main-content {
  position: relative;
  z-index: 1;
  padding: 100px 32px 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.welcome-section {
  margin-bottom: 32px;
}

.welcome-section h2 {
  font-size: 28px;
  color: white;
  margin-bottom: 8px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

.room-info {
  color: rgba(255,255,255,0.9);
  font-size: 16px;
}

/* ===== 数据卡片网格 ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 24px;
  position: relative;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.stat-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.card-header span {
  color: rgba(255,255,255,0.8);
  font-size: 13px;
  font-weight: 500;
}

.card-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.card-icon-wrapper.balance {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.card-icon-wrapper.kwh {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.card-icon-wrapper.days {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.card-icon-wrapper.days.danger {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
}

.card-icon-wrapper.device {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.card-icon {
  width: 22px;
  height: 22px;
  color: white;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.amount {
  font-size: 32px;
  font-weight: 800;
  color: white;
  display: flex;
  align-items: baseline;
  gap: 4px;
  line-height: 1.2;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.amount .currency {
  font-size: 20px;
  font-weight: 600;
}

.amount .number {
  font-size: 36px;
}

.amount .unit {
  font-size: 16px;
  font-weight: 500;
  color: rgba(255,255,255,0.7);
}

.amount.warning {
  color: #ff6b6b;
}

.amount.danger {
  color: #ff4757;
}

.trend {
  font-size: 13px;
  margin-top: 4px;
}

.trend .up {
  color: #43e97b;
}

.trend .down {
  color: #ff6b6b;
}

.price, .update-time, .predict-date {
  font-size: 13px;
  color: rgba(255,255,255,0.7);
}

.device-no {
  font-family: 'SF Mono', monospace;
  font-size: 15px;
  color: white;
  background: rgba(255,255,255,0.15);
  padding: 10px 14px;
  border-radius: 10px;
  word-break: break-all;
}

.refresh-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255,255,255,0.15) !important;
  border: 1px solid rgba(255,255,255,0.3) !important;
  color: white !important;
}

.refresh-btn:hover {
  background: rgba(255,255,255,0.25) !important;
}

/* ===== 统计概览 ===== */
.analysis-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.analysis-stats .stat-box {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.analysis-stats .stat-label {
  font-size: 13px;
  color: rgba(255,255,255,0.8);
  margin-bottom: 8px;
}

.analysis-stats .stat-value {
  font-size: 24px;
  font-weight: 700;
  color: white;
}

.analysis-stats .stat-value .unit {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255,255,255,0.7);
  margin-left: 4px;
}

/* ===== 图表区域 ===== */
.charts-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.chart-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.chart-header h3 {
  font-size: 18px;
  color: white;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.chart-subtitle {
  font-size: 13px;
  color: rgba(255,255,255,0.7);
}

.chart {
  height: 280px;
}

/* ===== 用电建议 ===== */
.tips-box {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.box-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.2);
}

.box-header .icon-wrapper {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.box-header .icon {
  font-size: 20px;
}

.box-header h3 {
  font-size: 16px;
  color: white;
  font-weight: 600;
}

.tip-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  background: rgba(255,255,255,0.1);
  border-radius: 12px;
}

.tip-icon-wrapper {
  width: 40px;
  height: 40px;
  background: rgba(255,255,255,0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tip-emoji {
  font-size: 20px;
}

.tip-content {
  flex: 1;
}

.tip-title {
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
  font-size: 14px;
}

.tip-desc {
  color: rgba(255,255,255,0.8);
  font-size: 13px;
  line-height: 1.5;
}

/* ===== 快捷入口 ===== */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  text-decoration: none;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.action-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
}

.action-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 8px 20px rgba(0,0,0,0.2);
}

.action-icon-wrapper.alerts {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
}

.action-icon-wrapper.heatmap {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.action-icon {
  width: 28px;
  height: 28px;
  color: white;
}

.action-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.action-title {
  font-size: 18px;
  font-weight: 600;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.action-desc {
  font-size: 14px;
  color: rgba(255,255,255,0.7);
}

.action-arrow {
  width: 24px;
  height: 24px;
  color: rgba(255,255,255,0.5);
  transition: all 0.3s ease;
}

.action-card:hover .action-arrow {
  color: white;
  transform: translateX(4px);
}

/* ===== 手机端底部导航 ===== */
.mobile-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  padding: 10px 0 calc(10px + env(safe-area-inset-bottom));
  z-index: 100;
}

.mobile-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  color: rgba(255,255,255,0.6);
  text-decoration: none;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.mobile-nav-item.active {
  color: white;
}

.mobile-nav-icon {
  width: 24px;
  height: 24px;
}

/* ===== 响应式设计 ===== */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .charts-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .navbar {
    padding: 0 20px;
    height: 60px;
  }
  
  .brand-text {
    font-size: 16px;
  }
  
  .back-text {
    display: none;
  }
  
  .nav-menu {
    display: none;
  }
  
  .user-name {
    display: none;
  }
  
  .main-content {
    padding: 80px 20px 90px;
  }
  
  .welcome-section h2 {
    font-size: 22px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  
  .stat-card {
    padding: 16px;
  }
  
  .amount .number {
    font-size: 24px;
  }
  
  .analysis-stats {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .chart {
    height: 240px;
  }
  
  .quick-actions {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .action-card {
    padding: 16px;
  }
  
  .mobile-nav {
    display: flex;
  }
}

@media (max-width: 380px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .amount .number {
    font-size: 28px;
  }
}
</style>
