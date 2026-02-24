<template>
  <div class="analysis-page">
    <nav class="simple-nav">
      <router-link to="/dashboard" class="back-link">
        <ArrowLeft class="back-icon" />
        <span>返回</span>
      </router-link>
      <h1>📊 用电分析</h1>
      <div class="nav-placeholder"></div>
    </nav>
    
    <main class="analysis-content">
      <!-- 统计卡片 -->
      <div class="stats-row">
        <div class="stat-box">
          <div class="stat-label">近7天平均日用电</div>
          <div class="stat-value">
            {{ analysisData.averageDailyKwh?.toFixed(2) || '--' }}
            <span class="unit">kWh</span>
          </div>
        </div>
        
        <div class="stat-box">
          <div class="stat-label">预计可用天数</div>
          <div class="stat-value" :class="{ warning: analysisData.current?.predictedDays < 7 }">
            {{ analysisData.current?.predictedDays || '--' }}
            <span class="unit">天</span>
          </div>
        </div>
        
        <div class="stat-box">
          <div class="stat-label">当前余额</div>
          <div class="stat-value">
            <span class="currency">¥</span>
            {{ analysisData.current?.balance?.toFixed(2) || '--' }}
          </div>
        </div>
      </div>
      
      <!-- 每日用电图表 -->
      <div class="chart-box">
        <div class="chart-header">
          <h3>📈 每日用电趋势</h3>
        </div>
        <v-chart class="analysis-chart" :option="dailyUsageOption" autoresize />
      </div>
      
      <!-- 用电建议 -->
      <div class="tips-box">
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
    </main>
    
    <!-- 手机端底部导航 -->
    <nav class="mobile-nav">
      <router-link to="/dashboard" class="mobile-nav-item">
        <DataLine class="mobile-nav-icon" />
        <span>概览</span>
      </router-link>
      <router-link to="/analysis" class="mobile-nav-item active">
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
import { ArrowLeft, DataLine, TrendCharts, Trophy } from '@element-plus/icons-vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { electricityApi } from '../api/index.js'

use([CanvasRenderer, BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent])

const analysisData = ref({
  dailyUsage: [],
  averageDailyKwh: 0,
  current: null
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

const tips = computed(() => {
  const data = analysisData.value
  const tips = []
  
  if (data.current?.predictedDays < 7 && data.current?.predictedDays > 0) {
    tips.push({
      icon: '⚠️',
      title: '余额不足警告',
      desc: `预计${data.current.predictedDays}天后电费耗尽，建议尽快充值！`
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

onMounted(async () => {
  try {
    const res = await electricityApi.getAnalysis()
    if (res.data.success) {
      analysisData.value = res.data.data
    }
  } catch (error) {
    console.error('加载分析数据失败:', error)
  }
})
</script>

<style scoped>
.analysis-page {
  min-height: 100vh;
  padding-bottom: 70px;
}

/* 顶部导航 */
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
.analysis-content {
  padding: 80px 24px 24px;
  max-width: 1000px;
  margin: 0 auto;
}

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-box {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
}

.stat-label {
  color: #718096;
  font-size: 13px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: #1a202c;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.stat-value .currency {
  font-size: 16px;
  font-weight: 600;
}

.stat-value .unit {
  font-size: 14px;
  font-weight: 500;
  color: #718096;
}

.stat-value.warning {
  color: #f56565;
}

/* 图表区 */
.chart-box, .tips-box {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}

.box-header, .chart-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.icon-wrapper {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon {
  font-size: 20px;
}

.box-header h3, .chart-header h3 {
  font-size: 16px;
  color: #1a202c;
  font-weight: 600;
}

.analysis-chart {
  height: 280px;
}

/* 建议列表 */
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
  background: #f8fafc;
  border-radius: 12px;
}

.tip-icon-wrapper {
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.tip-emoji {
  font-size: 20px;
}

.tip-content {
  flex: 1;
}

.tip-title {
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 4px;
  font-size: 14px;
}

.tip-desc {
  color: #718096;
  font-size: 13px;
  line-height: 1.5;
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
@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  
  .stat-box {
    padding: 16px 12px;
  }
  
  .stat-value {
    font-size: 18px;
  }
  
  .stat-value .currency,
  .stat-value .unit {
    font-size: 12px;
  }
}

@media (max-width: 640px) {
  .simple-nav {
    padding: 0 16px;
    height: 56px;
  }
  
  .simple-nav h1 {
    font-size: 16px;
  }
  
  .analysis-content {
    padding: 72px 16px 80px;
  }
  
  .stats-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .stat-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    text-align: left;
  }
  
  .stat-label {
    margin-bottom: 0;
    font-size: 14px;
  }
  
  .stat-value {
    font-size: 22px;
  }
  
  .chart-box, .tips-box {
    padding: 16px;
  }
  
  .analysis-chart {
    height: 220px;
  }
  
  .tip-item {
    padding: 12px;
  }
  
  /* 显示底部导航 */
  .mobile-nav {
    display: flex;
  }
}

@media (max-width: 380px) {
  .stat-value {
    font-size: 20px;
  }
}
</style>
