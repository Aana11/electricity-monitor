<template>
  <div class="heatmap-page">
    <nav class="simple-nav">
      <router-link to="/electricity" class="back-link">
        <ArrowLeft class="back-icon" />
        <span>返回</span>
      </router-link>
      <h1>📅 用电日历</h1>
      <div class="nav-placeholder"></div>
    </nav>

    <main class="heatmap-content">
      <!-- 统计概览 -->
      <div class="stats-row">
        <div class="stat-box">
          <div class="stat-label">本月总用电</div>
          <div class="stat-value">
            {{ monthlyStats.totalKwh.toFixed(1) }}
            <span class="unit">kWh</span>
          </div>
        </div>
        
        <div class="stat-box">
          <div class="stat-label">日均用电</div>
          <div class="stat-value">
            {{ monthlyStats.avgDaily.toFixed(1) }}
            <span class="unit">kWh</span>
          </div>
        </div>
        
        <div class="stat-box">
          <div class="stat-label">最高用电日</div>
          <div class="stat-value">
            {{ monthlyStats.maxKwh.toFixed(1) }}
            <span class="unit">kWh</span>
          </div>
        </div>
      </div>

      <!-- 热力图 -->
      <div class="heatmap-card">
        <div class="heatmap-header">
          <h3>🔥 用电热力图</h3>
          <div class="legend">
            <span>少</span>
            <div class="legend-gradient"></div>
            <span>多</span>
          </div>
        </div>

        <div class="calendar-grid">
          <!-- 星期标题 -->
          <div class="weekday-header" v-for="day in weekdays" :key="day">
            {{ day }}
          </div>
          
          <!-- 日期格子 -->
          <div
            v-for="(item, index) in calendarData"
            :key="index"
            class="calendar-cell"
            :class="{ 'empty': !item.date, 'today': item.isToday }"
            :style="item.usage > 0 ? { backgroundColor: getHeatColor(item.usage) } : {}"
          >
            <div class="cell-date" v-if="item.date">{{ item.day }}</div>
            <div class="cell-usage" v-if="item.usage > 0">{{ item.usage.toFixed(1) }}</div>
            <div class="cell-tooltip" v-if="item.date">
              <div class="tooltip-date">{{ item.date }}</div>
              <div class="tooltip-usage" v-if="item.usage > 0">
                用电: {{ item.usage.toFixed(2) }} kWh
              </div>
              <div class="tooltip-usage" v-else>无数据</div>
            </div>
          </div>
        </div>

        <!-- 月份切换 -->
        <div class="month-nav">
          <el-button @click="changeMonth(-1)" :icon="ArrowLeft" circle />
          <span class="current-month">{{ currentYear }}年{{ currentMonth }}月</span>
          <el-button @click="changeMonth(1)" :icon="ArrowRight" circle />
        </div>
      </div>

      <!-- 用电分析 -->
      <div class="analysis-card">
        <div class="analysis-header">
          <span class="title-icon">📊</span>
          <span>用电分析</span>
        </div>

        <div class="analysis-content-inner">
          <div class="analysis-item">
            <div class="analysis-label">用电最多</div>
            <div class="analysis-value" v-if="monthlyStats.maxDate">
              {{ monthlyStats.maxDate }} ({{ monthlyStats.maxKwh.toFixed(1) }} kWh)
            </div>
            <div class="analysis-value" v-else>--</div>
          </div>

          <div class="analysis-item">
            <div class="analysis-label">用电最少</div>
            <div class="analysis-value" v-if="monthlyStats.minDate">
              {{ monthlyStats.minDate }} ({{ monthlyStats.minKwh.toFixed(1) }} kWh)
            </div>
            <div class="analysis-value" v-else>--</div>
          </div>

          <div class="analysis-item">
            <div class="analysis-label">工作日平均</div>
            <div class="analysis-value">{{ monthlyStats.weekdayAvg.toFixed(1) }} kWh</div>
          </div>

          <div class="analysis-item">
            <div class="analysis-label">周末平均</div>
            <div class="analysis-value">{{ monthlyStats.weekendAvg.toFixed(1) }} kWh</div>
          </div>
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
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft, ArrowRight, DataLine, TrendCharts, Trophy } from '@element-plus/icons-vue'
import { electricityApi } from '../api/index.js'

const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)
const dailyData = ref([])

const monthlyStats = computed(() => {
  const data = dailyData.value.filter(d => d.used_kwh > 0)
  if (data.length === 0) {
    return {
      totalKwh: 0,
      avgDaily: 0,
      maxKwh: 0,
      maxDate: null,
      minKwh: 0,
      minDate: null,
      weekdayAvg: 0,
      weekendAvg: 0
    }
  }

  const usages = data.map(d => d.used_kwh)
  const totalKwh = usages.reduce((a, b) => a + b, 0)
  const maxKwh = Math.max(...usages)
  const minKwh = Math.min(...usages)
  const maxItem = data.find(d => d.used_kwh === maxKwh)
  const minItem = data.find(d => d.used_kwh === minKwh)

  // 区分工作日和周末
  const weekdayData = data.filter(d => {
    const date = new Date(d.date)
    const day = date.getDay()
    return day >= 1 && day <= 5
  })
  const weekendData = data.filter(d => {
    const date = new Date(d.date)
    const day = date.getDay()
    return day === 0 || day === 6
  })

  const weekdayAvg = weekdayData.length > 0 
    ? weekdayData.reduce((a, b) => a + b.used_kwh, 0) / weekdayData.length 
    : 0
  const weekendAvg = weekendData.length > 0 
    ? weekendData.reduce((a, b) => a + b.used_kwh, 0) / weekendData.length 
    : 0

  return {
    totalKwh,
    avgDaily: totalKwh / data.length,
    maxKwh,
    maxDate: maxItem?.date?.slice(5),
    minKwh,
    minDate: minItem?.date?.slice(5),
    weekdayAvg,
    weekendAvg
  }
})

const calendarData = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  
  // 获取当月第一天
  const firstDay = new Date(year, month - 1, 1)
  // 获取当月最后一天
  const lastDay = new Date(year, month, 0)
  
  const daysInMonth = lastDay.getDate()
  const firstDayOfWeek = firstDay.getDay()
  
  const data = []
  
  // 填充空白格子
  for (let i = 0; i < firstDayOfWeek; i++) {
    data.push({ date: null, day: null, usage: 0, isToday: false })
  }
  
  // 填充日期
  const today = new Date()
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayData = dailyData.value.find(d => d.date === dateStr)
    
    const isToday = today.getFullYear() === year && 
                   today.getMonth() + 1 === month && 
                   today.getDate() === day
    
    data.push({
      date: dateStr,
      day,
      usage: dayData?.used_kwh || 0,
      isToday
    })
  }
  
  return data
})

const getHeatColor = (usage) => {
  const max = monthlyStats.value.maxKwh || 1
  const ratio = usage / max
  
  // 从浅绿到深红的渐变
  if (ratio <= 0.2) return '#dcfce7'
  if (ratio <= 0.4) return '#bbf7d0'
  if (ratio <= 0.6) return '#86efac'
  if (ratio <= 0.8) return '#fca5a5'
  return '#ef4444'
}

const changeMonth = (delta) => {
  currentMonth.value += delta
  if (currentMonth.value > 12) {
    currentMonth.value = 1
    currentYear.value++
  } else if (currentMonth.value < 1) {
    currentMonth.value = 12
    currentYear.value--
  }
  loadData()
}

const loadData = async () => {
  try {
    // 获取当月数据
    const daysInMonth = new Date(currentYear.value, currentMonth.value, 0).getDate()
    const res = await electricityApi.getDailyUsage(daysInMonth)
    if (res.data.success) {
      dailyData.value = res.data.data
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

onMounted(loadData)
</script>

<style scoped>
.heatmap-page {
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
.heatmap-content {
  padding: 80px 24px 24px;
  max-width: 800px;
  margin: 0 auto;
}

/* 统计行 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-box {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: #718096;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #1a202c;
}

.stat-value .unit {
  font-size: 12px;
  font-weight: 500;
  color: #718096;
  margin-left: 2px;
}

/* 热力图卡片 */
.heatmap-card,
.analysis-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}

.heatmap-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.heatmap-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
}

.legend {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #718096;
}

.legend-gradient {
  width: 80px;
  height: 12px;
  background: linear-gradient(to right, #dcfce7, #bbf7d0, #86efac, #fca5a5, #ef4444);
  border-radius: 6px;
}

/* 日历网格 */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.weekday-header {
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  color: #718096;
  padding: 8px 0;
}

.calendar-cell {
  aspect-ratio: 1;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f1f5f9;
}

.calendar-cell:hover {
  transform: scale(1.1);
  z-index: 10;
}

.calendar-cell.empty {
  background: transparent;
  cursor: default;
}

.calendar-cell.empty:hover {
  transform: none;
}

.calendar-cell.today {
  border: 2px solid #667eea;
}

.cell-date {
  font-size: 12px;
  font-weight: 600;
  color: #1a202c;
}

.cell-usage {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 2px;
}

/* 提示框 */
.cell-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  z-index: 100;
  margin-bottom: 4px;
}

.calendar-cell:hover .cell-tooltip {
  opacity: 1;
  visibility: visible;
}

.tooltip-date {
  font-weight: 600;
  margin-bottom: 2px;
}

.tooltip-usage {
  color: #cbd5e1;
}

/* 月份导航 */
.month-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.current-month {
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
  min-width: 100px;
  text-align: center;
}

/* 分析卡片 */
.analysis-header {
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

.analysis-content-inner {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.analysis-item {
  padding: 12px;
  background: #f8fafc;
  border-radius: 10px;
}

.analysis-label {
  font-size: 12px;
  color: #718096;
  margin-bottom: 4px;
}

.analysis-value {
  font-size: 14px;
  font-weight: 600;
  color: #1a202c;
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

  .heatmap-content {
    padding: 72px 16px 80px;
  }

  .stats-row {
    gap: 8px;
  }

  .stat-box {
    padding: 12px;
  }

  .stat-value {
    font-size: 16px;
  }

  .heatmap-card,
  .analysis-card {
    padding: 16px;
  }

  .calendar-grid {
    gap: 4px;
  }

  .calendar-cell {
    border-radius: 6px;
  }

  .cell-date {
    font-size: 11px;
  }

  .cell-usage {
    font-size: 9px;
  }

  .weekday-header {
    font-size: 11px;
    padding: 6px 0;
  }

  .analysis-content-inner {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .mobile-nav {
    display: flex;
  }
}

@media (max-width: 380px) {
  .cell-usage {
    display: none;
  }
}
</style>
